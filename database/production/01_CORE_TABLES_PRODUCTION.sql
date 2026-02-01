-- ===================================================================
-- EDUNET19 - CORE TABLES (PRODUCTION)
-- Script 1/7: Tabelle Principali
-- ===================================================================
-- Esegui questo script per primo nel nuovo progetto Supabase
-- ===================================================================

-- Abilita estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================================================
-- 1. USER PROFILES (Tabella Base)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('istituto', 'privato')),
    email_verified BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 2. SCHOOL INSTITUTES
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.school_institutes (
    id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    institute_name VARCHAR(255) NOT NULL,
    institute_type VARCHAR(100) NOT NULL,
    institute_code VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(50),
    region VARCHAR(50),
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'Italia',
    phone VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(255),
    pec_email VARCHAR(255),
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    principal_name VARCHAR(255),
    founded_year INTEGER,
    student_count INTEGER,
    teacher_count INTEGER,
    verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    social_facebook VARCHAR(255),
    social_instagram VARCHAR(255),
    social_youtube VARCHAR(255),
    specializations TEXT[],
    methodologies TEXT[],
    interests TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 3. PRIVATE USERS (Students)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.private_users (
    id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    gender VARCHAR(20),
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    city VARCHAR(100),
    province VARCHAR(50),
    region VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Italia',
    current_school VARCHAR(255),
    education_level VARCHAR(100),
    interests TEXT[],
    skills TEXT[],
    languages TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- COMMENTI
-- ===================================================================
-- Queste sono le tabelle fondamentali del sistema.
-- Tutte le altre tabelle dipendono da queste.
-- 
-- Ordine di creazione:
-- 1. user_profiles (base per tutto)
-- 2. school_institutes (dipende da user_profiles)
-- 3. private_users (dipende da user_profiles)
-- ===================================================================
