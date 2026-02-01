/**
 * ===================================================================
 * EDUNET19 - MAIN APPLICATION SCRIPT
 * Modern JavaScript Architecture with ES6+ Features
 * ===================================================================
 */

'use strict';

/**
 * Main Application Class
 * Manages the entire application lifecycle and coordinates between modules
 */
class EduNetApp {
  constructor() {
    this.isInitialized = false;
    this.loadingScreen = null;
    this.modals = new Map();
    this.forms = new Map();
    this.currentUserType = null;
    this.observers = new Map();
    
    // Bind methods to preserve context
    this.handleDOMContentLoaded = this.handleDOMContentLoaded.bind(this);
    this.handleWindowLoad = this.handleWindowLoad.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleClick = this.handleClick.bind(this);
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', this.handleDOMContentLoaded);
      } else {
        await this.handleDOMContentLoaded();
      }
      
      // Wait for all resources to load
      if (document.readyState !== 'complete') {
        window.addEventListener('load', this.handleWindowLoad);
      } else {
        this.handleWindowLoad();
      }
      
    } catch (error) {
      console.error('Failed to initialize EduNet application:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Handle DOM content loaded event
   */
  async handleDOMContentLoaded() {
    console.log('🚀 EduNet19 - Initializing application...');
    
    try {
      // Initialize core components
      await this.initializeCore();
      
      // Setup UI components
      this.setupUI();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize external services
      await this.initializeServices();
      
      // Setup animations and interactions
      this.setupAnimations();
      
      this.isInitialized = true;
      console.log('✅ EduNet19 - Application initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Handle window load event
   */
  handleWindowLoad() {
    // Hide loading screen with animation
    this.hideLoadingScreen();
    
    // Initialize performance optimizations
    this.initializePerformanceOptimizations();
    
    // Setup lazy loading
    this.setupLazyLoading();
    
    console.log('🎉 EduNet19 - Application fully loaded');
  }

  /**
   * Initialize core application components
   */
  async initializeCore() {
    // Initialize loading screen
    this.loadingScreen = document.getElementById('loading-screen');
    
    // Initialize modals
    this.initializeModals();
    
    // Initialize forms
    this.initializeForms();
    
    // Initialize notification system
    this.initializeNotifications();
  }

  /**
   * Initialize modal system
   */
  initializeModals() {
    const modalElements = document.querySelectorAll('.modal');
    
    modalElements.forEach(modal => {
      const modalId = modal.id;
      this.modals.set(modalId, {
        element: modal,
        isOpen: false,
        backdrop: modal.querySelector('.modal-backdrop'),
        container: modal.querySelector('.modal-container'),
        closeButton: modal.querySelector('.modal-close')
      });
    });
  }

  /**
   * Initialize form system
   */
  initializeForms() {
    const formElements = document.querySelectorAll('.auth-form');
    
    formElements.forEach(form => {
      const formId = form.id;
      this.forms.set(formId, {
        element: form,
        validator: null,
        isSubmitting: false
      });
      
      // Setup form validation
      this.setupFormValidation(form);
      
      // Setup form submission
      this.setupFormSubmission(form);
    });
  }

  /**
   * Setup form validation
   */
  setupFormValidation(form) {
    const inputs = form.querySelectorAll('input[data-validate]');
    
    inputs.forEach(input => {
      // Real-time validation on input
      input.addEventListener('input', (e) => {
        this.debounce(() => this.validateField(e.target), 300)();
      });
      
      // Validation on blur
      input.addEventListener('blur', (e) => {
        this.validateField(e.target);
      });
    });
  }

  /**
   * Setup form submission
   */
  setupFormSubmission(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formId = form.id;
      const formData = this.forms.get(formId);
      
      if (formData.isSubmitting) return;
      
      try {
        formData.isSubmitting = true;
        this.setFormLoading(form, true);
        
        // Validate entire form
        const isValid = this.validateForm(form);
        if (!isValid) {
          throw new Error('Form validation failed');
        }
        
        // Submit form based on type
        await this.submitForm(form);
        
      } catch (error) {
        console.error('Form submission error:', error);
        this.showNotification(error.message || 'Errore durante l\'invio del form', 'error');
      } finally {
        formData.isSubmitting = false;
        this.setFormLoading(form, false);
      }
    });
  }

  /**
   * Validate a single field
   */
  validateField(field) {
    const validationType = field.getAttribute('data-validate');
    const value = field.value.trim();
    
    if (!window.eduNetValidation || !window.eduNetValidation.validators[validationType]) {
      return true;
    }
    
    let result;
    
    // Special handling for confirm password
    if (validationType === 'confirmPassword') {
      const passwordField = field.form.querySelector('input[data-validate="password"]');
      result = window.eduNetValidation.validators.confirmPassword(passwordField?.value, value);
    } else {
      result = window.eduNetValidation.validators[validationType](value);
    }
    
    this.displayFieldValidation(field, result);
    return result.isValid || result === true;
  }

  /**
   * Validate entire form
   */
  validateForm(form) {
    const inputs = form.querySelectorAll('input[data-validate]');
    let isValid = true;
    
    inputs.forEach(input => {
      const fieldValid = this.validateField(input);
      if (!fieldValid) isValid = false;
    });
    
    return isValid;
  }

  /**
   * Display field validation result
   */
  displayFieldValidation(field, result) {
    const errorElement = document.getElementById(`${field.id}-error`);
    
    // Clear previous validation state
    field.classList.remove('is-valid', 'is-invalid');
    if (errorElement) errorElement.textContent = '';
    
    if (result === true || (result.isValid && field.value.trim())) {
      field.classList.add('is-valid');
    } else if (result === false || (!result.isValid && result.errors)) {
      field.classList.add('is-invalid');
      if (errorElement && result.errors) {
        errorElement.textContent = result.errors[0];
      }
    }
  }

  /**
   * Submit form based on type
   */
  async submitForm(form) {
    const formId = form.id;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    switch (formId) {
      case 'loginForm':
        await this.handleLogin(data);
        break;
      case 'instituteForm':
        await this.handleInstituteRegistration(data);
        break;
      case 'privateForm':
        await this.handlePrivateRegistration(data);
        break;
      case 'forgotPasswordForm':
        await this.handleForgotPassword(data);
        break;
      default:
        throw new Error('Unknown form type');
    }
  }

  /**
   * Handle login form submission
   */
  async handleLogin(data) {
    if (!window.eduNetAuth) {
      throw new Error('Authentication service not available');
    }
    
    const result = await window.eduNetAuth.login(data.email, data.password);
    
    if (result.success) {
      this.closeModal('loginModal');
      this.resetForm('loginForm');
      // Redirect or update UI as needed
    }
  }

  /**
   * Handle institute registration
   */
  async handleInstituteRegistration(data) {
    if (!window.eduNetAuth) {
      throw new Error('Authentication service not available');
    }
    
    const result = await window.eduNetAuth.registerInstitute(data);
    
    if (result.success) {
      this.closeModal('registerModal');
      this.resetForm('instituteForm');
      this.resetUserTypeSelection();
    }
  }

  /**
   * Handle private user registration
   */
  async handlePrivateRegistration(data) {
    if (!window.eduNetAuth) {
      throw new Error('Authentication service not available');
    }
    
    const result = await window.eduNetAuth.registerPrivateUser(data);
    
    if (result.success) {
      this.closeModal('registerModal');
      this.resetForm('privateForm');
      this.resetUserTypeSelection();
    }
  }

  /**
   * Handle forgot password
   */
  async handleForgotPassword(data) {
    if (!window.eduNetPasswordReset) {
      throw new Error('Password reset service not available');
    }
    
    const result = await window.eduNetPasswordReset.sendPasswordResetEmail(data.email);
    
    if (result.success) {
      this.closeForgotPasswordModal();
      this.resetForm('forgotPasswordForm');
    }
  }

  /**
   * Setup UI components
   */
  setupUI() {
    // Setup user type selection
    this.setupUserTypeSelection();
    
    // Setup password toggles
    this.setupPasswordToggles();
    
    // Setup modal interactions
    this.setupModalInteractions();
    
    // Setup navigation
    this.setupNavigation();
  }

  /**
   * Setup user type selection
   */
  setupUserTypeSelection() {
    const userTypeCards = document.querySelectorAll('.user-type-card');
    
    userTypeCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const userType = card.onclick.toString().includes('institute') ? 'institute' : 'private';
        this.selectUserType(userType);
      });
    });
  }

  /**
   * Select user type
   */
  selectUserType(type) {
    this.currentUserType = type;
    
    // Update UI
    const userTypeCards = document.querySelectorAll('.user-type-card');
    const instituteForm = document.getElementById('instituteForm');
    const privateForm = document.getElementById('privateForm');
    const userTypeSelection = document.querySelector('.user-type-selection');
    
    // Reset all cards
    userTypeCards.forEach(card => card.classList.remove('active'));
    
    // Hide all forms
    instituteForm.style.display = 'none';
    privateForm.style.display = 'none';
    instituteForm.classList.remove('active');
    privateForm.classList.remove('active');
    
    // Show selected form
    if (type === 'institute') {
      userTypeCards[0].classList.add('active');
      instituteForm.style.display = 'grid';
      instituteForm.classList.add('active');
    } else if (type === 'private') {
      userTypeCards[1].classList.add('active');
      privateForm.style.display = 'grid';
      privateForm.classList.add('active');
    }
    
    // Hide user type selection
    userTypeSelection.style.display = 'none';
    
    // Focus first input
    setTimeout(() => {
      const firstInput = (type === 'institute' ? instituteForm : privateForm).querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  /**
   * Reset user type selection
   */
  resetUserTypeSelection() {
    this.currentUserType = null;
    
    const userTypeCards = document.querySelectorAll('.user-type-card');
    const instituteForm = document.getElementById('instituteForm');
    const privateForm = document.getElementById('privateForm');
    const userTypeSelection = document.querySelector('.user-type-selection');
    
    // Reset cards
    userTypeCards.forEach(card => card.classList.remove('active'));
    
    // Hide forms
    instituteForm.style.display = 'none';
    privateForm.style.display = 'none';
    instituteForm.classList.remove('active');
    privateForm.classList.remove('active');
    
    // Show user type selection
    userTypeSelection.style.display = 'block';
  }

  /**
   * Setup password toggles
   */
  setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    
    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const input = button.parentElement.querySelector('input');
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
          button.setAttribute('aria-label', 'Nascondi password');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
          button.setAttribute('aria-label', 'Mostra password');
        }
      });
    });
  }

  /**
   * Setup modal interactions
   */
  setupModalInteractions() {
    // Setup forgot password link
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openForgotPasswordModal();
      });
    }
  }

  /**
   * Setup navigation
   */
  setupNavigation() {
    // Add scroll effect to header
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
      const header = document.querySelector('.header');
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      
      lastScrollY = currentScrollY;
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Global event listeners
    window.addEventListener('resize', this.debounce(this.handleResize, 250));
    window.addEventListener('scroll', this.throttle(this.handleScroll, 16));
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('click', this.handleClick);
    
    // Modal backdrop clicks
    this.modals.forEach((modal, modalId) => {
      if (modal.backdrop) {
        modal.backdrop.addEventListener('click', () => {
          this.closeModal(modalId);
        });
      }
      
      if (modal.closeButton) {
        modal.closeButton.addEventListener('click', () => {
          this.closeModal(modalId);
        });
      }
    });
  }

  /**
   * Handle global click events
   */
  handleClick(e) {
    // Handle modal triggers
    if (e.target.matches('[onclick*="openModal"]')) {
      e.preventDefault();
      const modalType = e.target.onclick.toString().match(/'([^']+)'/)?.[1];
      if (modalType) {
        this.openModal(modalType === 'login' ? 'loginModal' : 'registerModal');
      }
    }
    
    // Handle modal switches
    if (e.target.matches('[onclick*="switchModal"]')) {
      e.preventDefault();
      const matches = e.target.onclick.toString().match(/'([^']+)'.*'([^']+)'/);
      if (matches) {
        this.switchModal(matches[1] + 'Modal', matches[2] + 'Modal');
      }
    }
  }

  /**
   * Handle global keydown events
   */
  handleKeydown(e) {
    // Close modals with Escape key
    if (e.key === 'Escape') {
      this.modals.forEach((modal, modalId) => {
        if (modal.isOpen) {
          this.closeModal(modalId);
        }
      });
      
      // Close forgot password modal
      const forgotModal = document.getElementById('forgotPasswordModal');
      if (forgotModal && forgotModal.style.display === 'block') {
        this.closeForgotPasswordModal();
      }
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Update modal positioning if needed
    this.modals.forEach(modal => {
      if (modal.isOpen) {
        this.updateModalPosition(modal);
      }
    });
  }

  /**
   * Handle window scroll
   */
  handleScroll() {
    // Implement scroll-based animations or effects
    this.updateScrollAnimations();
  }

  /**
   * Initialize external services
   */
  async initializeServices() {
    // Wait for external services to be available
    await this.waitForServices();
    
    // Initialize validation system
    if (window.eduNetValidation) {
      window.eduNetValidation.initializeValidation();
    }
    
    // Initialize authentication system
    if (window.eduNetAuth) {
      await window.eduNetAuth.initialize();
      
      // Controlla se l'utente è già autenticato e mostra un messaggio
      if (window.eduNetAuth.isAuthenticated()) {
        console.log('Utente già autenticato, mostra opzione per andare alla homepage');
        this.showAuthenticatedUserOptions();
      }
    }
    
    // Initialize error handling
    if (window.eduNetErrorHandler) {
      // Error handler is already initialized globally
    }
  }

  /**
   * Show options for already authenticated users
   */
  showAuthenticatedUserOptions() {
    // Crea un banner per utenti già autenticati
    const existingBanner = document.getElementById('authenticated-user-banner');
    if (existingBanner) return; // Evita duplicati
    
    const banner = document.createElement('div');
    banner.id = 'authenticated-user-banner';
    banner.className = 'authenticated-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-message">
          <i class="fas fa-user-check" aria-hidden="true"></i>
          <span>Sei già connesso! Vuoi andare alla homepage?</span>
        </div>
        <div class="banner-actions">
          <button class="btn btn-primary" onclick="window.location.href='homepage.html'">
            <i class="fas fa-home" aria-hidden="true"></i>
            Vai alla Homepage
          </button>
          <button class="btn btn-outline" onclick="this.parentElement.parentElement.parentElement.remove()">
            <i class="fas fa-times" aria-hidden="true"></i>
            Rimani qui
          </button>
        </div>
      </div>
    `;
    
    // Aggiungi stili per il banner
    const style = document.createElement('style');
    style.textContent = `
      .authenticated-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
        color: white;
        padding: var(--space-4);
        z-index: var(--z-toast);
        box-shadow: var(--shadow-lg);
        animation: slideDown 0.5s ease-out;
      }
      
      .banner-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 1200px;
        margin: 0 auto;
        gap: var(--space-4);
      }
      
      .banner-message {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-weight: var(--font-weight-medium);
      }
      
      .banner-message i {
        font-size: var(--font-size-lg);
        color: var(--color-secondary);
      }
      
      .banner-actions {
        display: flex;
        gap: var(--space-3);
      }
      
      .banner-actions .btn {
        padding: var(--space-2) var(--space-4);
        font-size: var(--font-size-sm);
        min-height: auto;
      }
      
      @keyframes slideDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @media (max-width: 768px) {
        .banner-content {
          flex-direction: column;
          text-align: center;
          gap: var(--space-3);
        }
        
        .banner-actions {
          justify-content: center;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(banner);
    
    // Auto-rimuovi il banner dopo 10 secondi
    setTimeout(() => {
      if (banner.parentElement) {
        banner.style.animation = 'slideUp 0.5s ease-out forwards';
        setTimeout(() => {
          if (banner.parentElement) {
            banner.remove();
          }
        }, 500);
      }
    }, 10000);
  }

  /**
   * Wait for external services to be available
   */
  async waitForServices() {
    const maxWaitTime = 10000; // 10 seconds
    const checkInterval = 100; // 100ms
    let waitTime = 0;
    
    return new Promise((resolve) => {
      const checkServices = () => {
        if (
          window.eduNetAuth &&
          window.eduNetValidation &&
          window.eduNetErrorHandler &&
          window.eduNetPasswordReset
        ) {
          resolve();
        } else if (waitTime >= maxWaitTime) {
          console.warn('Some services may not be available');
          resolve();
        } else {
          waitTime += checkInterval;
          setTimeout(checkServices, checkInterval);
        }
      };
      
      checkServices();
    });
  }

  /**
   * Setup animations and interactions
   */
  setupAnimations() {
    // Setup intersection observer for scroll animations
    this.setupScrollAnimations();
    
    // Setup hover effects
    this.setupHoverEffects();
    
    // Setup loading animations
    this.setupLoadingAnimations();
  }

  /**
   * Setup scroll animations
   */
  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.feature-card, .benefit-item, .stat-item');
    animatedElements.forEach(el => {
      el.classList.add('animate-on-scroll');
      observer.observe(el);
    });
    
    this.observers.set('scroll', observer);
  }

  /**
   * Setup hover effects
   */
  setupHoverEffects() {
    // Add enhanced hover effects for interactive elements
    const interactiveElements = document.querySelectorAll('.btn, .feature-card, .user-type-card');
    
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        element.style.transform = 'translateY(-2px)';
      });
      
      element.addEventListener('mouseleave', () => {
        element.style.transform = '';
      });
    });
  }

  /**
   * Setup loading animations
   */
  setupLoadingAnimations() {
    // Add CSS for loading animations
    const style = document.createElement('style');
    style.textContent = `
      .animate-on-scroll {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      
      .animate-on-scroll.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      
      .form-loading {
        pointer-events: none;
        opacity: 0.7;
      }
      
      .form-loading .btn {
        position: relative;
        color: transparent;
      }
      
      .form-loading .btn::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Initialize performance optimizations
   */
  initializePerformanceOptimizations() {
    // Implement performance optimizations
    this.optimizeImages();
    this.preloadCriticalResources();
  }

  /**
   * Setup lazy loading
   */
  setupLazyLoading() {
    // Implement lazy loading for images and other resources
    if ('IntersectionObserver' in window) {
      const lazyImages = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });
      
      lazyImages.forEach(img => imageObserver.observe(img));
      this.observers.set('images', imageObserver);
    }
  }

  /**
   * Initialize notification system
   */
  initializeNotifications() {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="fas ${this.getNotificationIcon(type)}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close" aria-label="Chiudi notifica">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add close functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
      this.removeNotification(notification);
    });
    
    // Add to container
    container.appendChild(notification);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }
    
    return notification;
  }

  /**
   * Remove notification
   */
  removeNotification(notification) {
    if (notification && notification.parentElement) {
      notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.parentElement.removeChild(notification);
        }
      }, 300);
    }
  }

  /**
   * Get notification icon
   */
  getNotificationIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
  }

  /**
   * Modal management methods
   */
  openModal(modalId) {
    const modal = this.modals.get(modalId);
    if (!modal) return;
    
    modal.element.style.display = 'flex';
    modal.element.setAttribute('aria-hidden', 'false');
    modal.isOpen = true;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus management
    setTimeout(() => {
      const firstInput = modal.element.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
    
    // Add animation class
    modal.container.style.animation = 'slideUp 0.4s ease-out';
  }

  closeModal(modalId) {
    const modal = this.modals.get(modalId);
    if (!modal) return;
    
    modal.element.style.display = 'none';
    modal.element.setAttribute('aria-hidden', 'true');
    modal.isOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Reset form if exists
    const form = modal.element.querySelector('form');
    if (form) {
      this.resetForm(form.id);
    }
    
    // Reset user type selection for register modal
    if (modalId === 'registerModal') {
      this.resetUserTypeSelection();
    }
  }

  switchModal(fromModalId, toModalId) {
    this.closeModal(fromModalId);
    setTimeout(() => {
      this.openModal(toModalId);
    }, 100);
  }

  openForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
      
      setTimeout(() => {
        const input = modal.querySelector('input');
        if (input) input.focus();
      }, 100);
    }
  }

  closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      this.resetForm('forgotPasswordForm');
    }
  }

  /**
   * Form management methods
   */
  resetForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Reset form data
    form.reset();
    
    // Clear validation states
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      input.classList.remove('is-valid', 'is-invalid');
    });
    
    // Clear error messages
    const errorElements = form.querySelectorAll('.form-error');
    errorElements.forEach(error => {
      error.textContent = '';
    });
    
    // Reset password toggles
    const passwordInputs = form.querySelectorAll('input[type="text"][data-validate="password"], input[type="text"][data-validate="confirmPassword"]');
    passwordInputs.forEach(input => {
      input.type = 'password';
      const toggle = input.parentElement.querySelector('.password-toggle i');
      if (toggle) {
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
      }
    });
  }

  setFormLoading(form, isLoading) {
    if (isLoading) {
      form.classList.add('form-loading');
    } else {
      form.classList.remove('form-loading');
    }
  }

  /**
   * Utility methods
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('hidden');
      setTimeout(() => {
        this.loadingScreen.style.display = 'none';
      }, 350);
    }
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError(error) {
    console.error('Initialization error:', error);
    
    // Hide loading screen
    this.hideLoadingScreen();
    
    // Show error message to user
    this.showNotification(
      'Si è verificato un errore durante il caricamento. Ricarica la pagina.',
      'error',
      0 // Don't auto-hide
    );
  }

  /**
   * Update scroll animations
   */
  updateScrollAnimations() {
    // Implement scroll-based animations
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    
    // Parallax effect for hero background
    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground) {
      heroBackground.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
  }

  /**
   * Update modal position
   */
  updateModalPosition(modal) {
    // Implement modal positioning updates if needed
  }

  /**
   * Optimize images
   */
  optimizeImages() {
    // Implement image optimization
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
    });
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources() {
    // Preload critical resources
    const criticalResources = [
      // Add critical resources here
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      document.head.appendChild(link);
    });
  }

  /**
   * Cleanup method
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('DOMContentLoaded', this.handleDOMContentLoaded);
    window.removeEventListener('load', this.handleWindowLoad);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('click', this.handleClick);
    
    // Disconnect observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    
    // Clear data structures
    this.modals.clear();
    this.forms.clear();
    this.observers.clear();
    
    console.log('EduNet19 application destroyed');
  }
}

/**
 * Global functions for backward compatibility
 */
window.openModal = function(type) {
  if (window.eduNetApp) {
    const modalId = type === 'login' ? 'loginModal' : 'registerModal';
    window.eduNetApp.openModal(modalId);
  }
};

window.closeModal = function(type) {
  if (window.eduNetApp) {
    const modalId = type === 'login' ? 'loginModal' : 'registerModal';
    window.eduNetApp.closeModal(modalId);
  }
};

window.switchModal = function(from, to) {
  if (window.eduNetApp) {
    const fromModalId = from === 'login' ? 'loginModal' : 'registerModal';
    const toModalId = to === 'login' ? 'loginModal' : 'registerModal';
    window.eduNetApp.switchModal(fromModalId, toModalId);
  }
};

window.selectUserType = function(type) {
  if (window.eduNetApp) {
    window.eduNetApp.selectUserType(type);
  }
};

window.togglePassword = function(inputId) {
  console.log('👁️ togglePassword chiamato per:', inputId);
  
  const input = document.getElementById(inputId);
  if (!input) {
    console.error('❌ Input non trovato:', inputId);
    return;
  }
  
  const inputGroup = input.parentElement;
  if (!inputGroup) {
    console.error('❌ Input group non trovato');
    return;
  }
  
  const button = inputGroup.querySelector('.password-toggle');
  if (!button) {
    console.error('❌ Button toggle non trovato');
    return;
  }
  
  const icon = button.querySelector('i');
  if (!icon) {
    console.error('❌ Icona non trovata');
    return;
  }
  
  // Salva lo stato desiderato
  const currentType = input.getAttribute('type');
  const newType = currentType === 'password' ? 'text' : 'password';
  
  // Marca l'input come "toggled" per evitare reset
  input.dataset.passwordToggled = newType;
  
  // Cambia il type
  input.setAttribute('type', newType);
  input.type = newType;
  
  // Aggiorna icona
  if (newType === 'text') {
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
    button.setAttribute('aria-label', 'Nascondi password');
    console.log('✅ Password mostrata');
  } else {
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
    button.setAttribute('aria-label', 'Mostra password');
    console.log('✅ Password nascosta');
  }
  
  // Previeni reset del type con MutationObserver
  if (!input.dataset.observerAttached) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'type') {
          const desiredType = input.dataset.passwordToggled;
          if (desiredType && input.type !== desiredType) {
            console.log('🛡️ Prevenuto reset del type da', input.type, 'a', desiredType);
            input.type = desiredType;
            input.setAttribute('type', desiredType);
          }
        }
      });
    });
    
    observer.observe(input, {
      attributes: true,
      attributeFilter: ['type']
    });
    
    input.dataset.observerAttached = 'true';
    console.log('🛡️ MutationObserver attivato per', inputId);
  }
};

window.closeForgotPasswordModal = function() {
  if (window.eduNetApp) {
    window.eduNetApp.closeForgotPasswordModal();
  }
};

/**
 * Scroll to a specific section with smooth animation
 * @param {string} sectionId - The ID of the section to scroll to
 */
window.scrollToSection = function(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) {
    console.warn('⚠️ Section not found:', sectionId);
    return;
  }
  
  // Get header height for offset
  const header = document.querySelector('.header');
  const headerHeight = header ? header.offsetHeight : 0;
  
  // Calculate target position with offset
  const targetPosition = section.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
  
  // Smooth scroll to section
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
  
  console.log('📜 Scrolling to section:', sectionId);
};

/**
 * Initialize application when script loads
 */
(() => {
  // Initialize the application
  window.eduNetApp = new EduNetApp();
  
  // Add global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.eduNetErrorHandler) {
      window.eduNetErrorHandler.handle(event.error, 'Global Error');
    }
  });
  
  // Add unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.eduNetErrorHandler) {
      window.eduNetErrorHandler.handle(event.reason, 'Unhandled Promise Rejection');
    }
  });
  
  console.log('🎯 EduNet19 - Script loaded successfully');
})();