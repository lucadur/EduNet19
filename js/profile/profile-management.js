/**
 * Sistema di Gestione Profili Utente per EduNet19
 * Gestisce profili specifici per istituti e utenti privati
 */

class EduNetProfileManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.currentProfile = null;
        this.profileType = null; // 'institute' o 'private'
        
        this.init();
    }
    
    async init() {
        // Usa il client Supabase centralizzato
        this.supabase = await window.supabaseClientManager.getClient();
        
        if (!this.supabase) {
            console.warn('⚠️ Client Supabase non disponibile per ProfileManager');
        }
    }
    
    // Carica il profilo completo dell'utente corrente
    async loadCurrentUserProfile() {
        try {
            if (!this.supabase) {
                throw new Error('Supabase non inizializzato');
            }
            
            const { data: { user }, error: userError } = await this.supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) return null;
            
            this.currentUser = user;
            
            // Carica il profilo base
            const { data: profile, error: profileError } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
                
            if (profileError) throw profileError;
            this.currentProfile = profile;
            this.profileType = profile.user_type;
            
            // Carica dati specifici in base al tipo
            if (profile.user_type === 'institute') {
                await this.loadInstituteProfile();
            } else if (profile.user_type === 'private') {
                await this.loadPrivateUserProfile();
            }
            
            return this.currentProfile;
            
        } catch (error) {
            console.error('Errore nel caricamento profilo:', error);
            throw error;
        }
    }
    
    // Carica dati specifici dell'istituto
    async loadInstituteProfile() {
        try {
            const { data: instituteData, error } = await this.supabase
                .from('school_institutes')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();
                
            if (error) throw error;
            
            this.currentProfile.instituteData = instituteData;
            return instituteData;
            
        } catch (error) {
            console.error('Errore nel caricamento dati istituto:', error);
            throw error;
        }
    }
    
    // Carica dati specifici dell'utente privato
    async loadPrivateUserProfile() {
        try {
            const { data: privateData, error } = await this.supabase
                .from('private_users')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();
                
            if (error) throw error;
            
            this.currentProfile.privateData = privateData;
            return privateData;
            
        } catch (error) {
            console.error('Errore nel caricamento dati utente privato:', error);
            throw error;
        }
    }
    
    // Aggiorna il profilo base
    async updateBaseProfile(profileData) {
        try {
            if (!this.currentUser) {
                throw new Error('Nessun utente autenticato');
            }
            
            const { data, error } = await this.supabase
                .from('user_profiles')
                .update({
                    display_name: profileData.displayName,
                    bio: profileData.bio,
                    avatar_url: profileData.avatarUrl,
                    location: profileData.location,
                    website: profileData.website,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', this.currentUser.id)
                .select()
                .single();
                
            if (error) throw error;
            
            // Aggiorna il profilo locale
            Object.assign(this.currentProfile, data);
            
            return data;
            
        } catch (error) {
            console.error('Errore nell\'aggiornamento profilo base:', error);
            throw error;
        }
    }
    
    // Aggiorna dati specifici dell'istituto
    async updateInstituteProfile(instituteData) {
        try {
            if (!this.currentUser || this.profileType !== 'institute') {
                throw new Error('Utente non autorizzato per questa operazione');
            }
            
            const { data, error } = await this.supabase
                .from('school_institutes')
                .update({
                    institute_name: instituteData.instituteName,
                    institute_type: instituteData.instituteType,
                    description: instituteData.description,
                    address: instituteData.address,
                    phone: instituteData.phone,
                    website: instituteData.website,
                    pec_email: instituteData.pecEmail,
                    principal_name: instituteData.principalName,
                    student_count: instituteData.studentCount,
                    teacher_count: instituteData.teacherCount,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', this.currentUser.id)
                .select()
                .single();
                
            if (error) throw error;
            
            // Aggiorna i dati locali
            this.currentProfile.instituteData = data;
            
            return data;
            
        } catch (error) {
            console.error('Errore nell\'aggiornamento profilo istituto:', error);
            throw error;
        }
    }
    
    // Aggiorna dati specifici dell'utente privato
    async updatePrivateUserProfile(privateData) {
        try {
            if (!this.currentUser || this.profileType !== 'private') {
                throw new Error('Utente non autorizzato per questa operazione');
            }
            
            const { data, error } = await this.supabase
                .from('private_users')
                .update({
                    first_name: privateData.firstName,
                    last_name: privateData.lastName,
                    date_of_birth: privateData.dateOfBirth,
                    phone: privateData.phone,
                    education_level: privateData.educationLevel,
                    interests: privateData.interests,
                    profession: privateData.profession,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', this.currentUser.id)
                .select()
                .single();
                
            if (error) throw error;
            
            // Aggiorna i dati locali
            this.currentProfile.privateData = data;
            
            return data;
            
        } catch (error) {
            console.error('Errore nell\'aggiornamento profilo utente privato:', error);
            throw error;
        }
    }
    
    // Carica i seguiti dell'utente
    async loadUserFollows() {
        try {
            if (!this.currentUser) {
                throw new Error('Nessun utente autenticato');
            }
            
            const { data, error } = await this.supabase
                .from('user_follows')
                .select(`
                    *,
                    followed_profile:user_profiles!user_follows_followed_user_id_fkey(
                        *,
                        school_institutes(*),
                        private_users(*)
                    )
                `)
                .eq('follower_user_id', this.currentUser.id);
                
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Errore nel caricamento seguiti:', error);
            throw error;
        }
    }
    
    // Segui un utente/istituto
    async followUser(targetUserId) {
        try {
            if (!this.currentUser) {
                throw new Error('Nessun utente autenticato');
            }
            
            if (targetUserId === this.currentUser.id) {
                throw new Error('Non puoi seguire te stesso');
            }
            
            const { data, error } = await this.supabase
                .from('user_follows')
                .insert({
                    follower_user_id: this.currentUser.id,
                    followed_user_id: targetUserId
                })
                .select()
                .single();
                
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Errore nel seguire utente:', error);
            throw error;
        }
    }
    
    // Smetti di seguire un utente/istituto
    async unfollowUser(targetUserId) {
        try {
            if (!this.currentUser) {
                throw new Error('Nessun utente autenticato');
            }
            
            const { error } = await this.supabase
                .from('user_follows')
                .delete()
                .eq('follower_user_id', this.currentUser.id)
                .eq('followed_user_id', targetUserId);
                
            if (error) throw error;
            
            return true;
            
        } catch (error) {
            console.error('Errore nel smettere di seguire utente:', error);
            throw error;
        }
    }
    
    // Verifica se l'utente corrente segue un altro utente
    async isFollowing(targetUserId) {
        try {
            if (!this.currentUser) return false;
            
            const { data, error } = await this.supabase
                .from('user_follows')
                .select('id')
                .eq('follower_user_id', this.currentUser.id)
                .eq('followed_user_id', targetUserId)
                .single();
                
            return !error && data;
            
        } catch (error) {
            return false;
        }
    }
    
    // Carica statistiche del profilo
    async loadProfileStats() {
        try {
            if (!this.currentUser) {
                throw new Error('Nessun utente autenticato');
            }
            
            // Conta i follower
            const { count: followersCount, error: followersError } = await this.supabase
                .from('user_follows')
                .select('*', { count: 'exact', head: true })
                .eq('followed_user_id', this.currentUser.id);
                
            if (followersError) throw followersError;
            
            // Conta i seguiti
            const { count: followingCount, error: followingError } = await this.supabase
                .from('user_follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_user_id', this.currentUser.id);
                
            if (followingError) throw followingError;
            
            // Conta i post (solo per istituti)
            let postsCount = 0;
            if (this.profileType === 'institute') {
                const { count, error: postsError } = await this.supabase
                    .from('institute_posts')
                    .select('*', { count: 'exact', head: true })
                    .eq('institute_user_id', this.currentUser.id);
                    
                if (!postsError) postsCount = count;
            }
            
            return {
                followers: followersCount || 0,
                following: followingCount || 0,
                posts: postsCount
            };
            
        } catch (error) {
            console.error('Errore nel caricamento statistiche profilo:', error);
            throw error;
        }
    }
    
    // Cerca profili
    async searchProfiles(query, type = null) {
        try {
            // Search in school_institutes table
            let instituteResults = [];
            if (!type || type === 'istituto') {
                try {
                    const { data: institutes } = await this.supabase
                        .from('school_institutes')
                        .select('id, institute_name, institute_type, city, institute_code')
                        .ilike('institute_name', `%${query}%`)
                        .limit(20); // Fetch more to filter
                    
                    if (institutes) {
                        // 🔒 Filtra istituti "sospetti" (nomi che non sembrano scuole reali)
                        const schoolKeywords = ['liceo', 'istituto', 'scuola', 'comprensivo', 'tecnico', 
                            'professionale', 'università', 'politecnico', 'accademia', 'conservatorio',
                            'ic ', 'i.c.', 'its', 'ipsia', 'itis', 'itc', 'ipseoa'];
                        
                        const validInstitutes = institutes.filter(institute => {
                            const name = (institute.institute_name || '').toLowerCase();
                            
                            // Se ha codice meccanografico, è sicuramente valido
                            if (institute.institute_code) return true;
                            
                            // Se il nome contiene parole chiave di scuole, è valido
                            if (schoolKeywords.some(keyword => name.includes(keyword))) return true;
                            
                            // Se il tipo è specifico (non generico), è probabilmente valido
                            const validTypes = ['Scuola Primaria', 'Scuola Secondaria', 'Liceo', 'Università'];
                            if (validTypes.some(t => institute.institute_type?.includes(t))) return true;
                            
                            // Altrimenti, escludi (potrebbe essere un account di test o errore)
                            console.log('🔒 Istituto escluso dalla ricerca (nome sospetto):', name);
                            return false;
                        });
                        
                        instituteResults = validInstitutes.slice(0, 10).map(institute => ({
                            id: institute.id,
                            user_type: 'istituto',
                            school_institutes: {
                                institute_name: institute.institute_name,
                                city: institute.city
                            }
                        }));
                    }
                } catch (error) {
                    console.warn('Error searching institutes:', error);
                }
            }
            
            // 🔒 PRIVACY: Ricerca utenti privati DISABILITATA
            // Gli utenti privati non sono ricercabili per proteggere i dati sensibili
            let userResults = [];
            // if (!type || type === 'privato') {
            //     // DISABLED FOR PRIVACY
            // }
            
            // Combine results
            const allResults = [...instituteResults, ...userResults];
            return allResults.slice(0, 20); // Limit total results
            
        } catch (error) {
            console.error('Errore nella ricerca profili:', error);
            return []; // Return empty array instead of throwing
        }
    }
    
    // Getter per informazioni utente corrente
    getCurrentUser() {
        return this.currentUser;
    }
    
    getCurrentProfile() {
        return this.currentProfile;
    }
    
    getProfileType() {
        return this.profileType;
    }
    
    isInstitute() {
        return this.profileType === 'institute';
    }
    
    isPrivateUser() {
        return this.profileType === 'private';
    }
}

// Inizializzazione globale
window.eduNetProfileManager = new EduNetProfileManager();

// Export per moduli ES6 se supportati
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EduNetProfileManager;
}