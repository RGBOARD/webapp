from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.executors.pool import ThreadPoolExecutor
import atexit
from flask import current_app

class SchedulerService:
    """
    A service that manages all background tasks in the application.
    This is a singleton that should be initialized with the app.
    """
    
    def __init__(self):
        self.scheduler = None
        self.initialized = False
        self.app = None
    
    def init_app(self, app=None):
        """
        Initialize the scheduler with Flask application context
        
        :param app: Flask application instance (optional if already set)
        """
        if app:
            self.app = app
        
        if self.initialized:
            # If already initialized but not running, recreate the scheduler
            if self.scheduler and not self.scheduler.running:
                self.scheduler = None
                self.initialized = False
            else:
                return
        
        executors = {
            'default': ThreadPoolExecutor(max_workers=10)
        }
        
        self.scheduler = BackgroundScheduler(executors=executors)
        
        # Setup jobs
        self._setup_rotation_jobs()
        
        self.scheduler.start()
        
        # Register with atexit to ensure shutdown happens on app termination
        atexit.register(self._shutdown_scheduler)
        
        self.initialized = True
        print("Scheduler service initialized")
    
    def _setup_rotation_jobs(self):
        """Set up background jobs for the rotation system."""
        from model.rotation_system import RotationSystemDAO
        
        # We need to use a wrapper function that creates an application context
        def process_scheduled_images_with_context():
            with self.app.app_context():
                dao = RotationSystemDAO()
                dao.process_scheduled_images()
        
        def clean_expired_images_with_context():
            with self.app.app_context():
                dao = RotationSystemDAO()
                dao.clean_expired_images()
        
        def check_rotation_with_context():
            with self.app.app_context():
                dao = RotationSystemDAO()
                dao.check_rotation()
        
        # Schedule jobs with context wrappers
        self.scheduler.add_job(
            process_scheduled_images_with_context,
            'interval',
            seconds=5,
            id='process_scheduled_images'
        )
        
        self.scheduler.add_job(
            clean_expired_images_with_context,
            'interval',
            minutes=1,
            id='clean_expired_images'
        )
        
        # Check rotation every second
        self.scheduler.add_job(
            check_rotation_with_context,
            'interval',
            seconds=1,
            id='check_rotation'
        )
    
    def _shutdown_scheduler(self):
        """Ensure the scheduler is shut down cleanly."""
        if self.scheduler and self.scheduler.running:
            try:
                self.scheduler.shutdown(wait=False)
                print("Scheduler service shut down by atexit")
            except:
                print("Failed to shut down scheduler")
    
    def add_job(self, func, trigger, **kwargs):
        """
        Add a job to the scheduler.
        
        For functions that need Flask's application context, use:
        
        def my_job_with_context():
            with scheduler_service.app.app_context():
                # Your actual job code here
                pass
        
        scheduler_service.add_job(my_job_with_context, 'interval', minutes=5)
        """
        if not self.initialized:
            raise RuntimeError("Scheduler service not initialized")
        
        return self.scheduler.add_job(func, trigger, **kwargs)
    
    def remove_job(self, job_id):
        """Remove a job from the scheduler."""
        if not self.initialized:
            raise RuntimeError("Scheduler service not initialized")
        
        return self.scheduler.remove_job(job_id)

# Create a singleton instance
scheduler_service = SchedulerService()
