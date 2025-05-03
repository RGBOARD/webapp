from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.executors.pool import ThreadPoolExecutor
from flask import Flask, g
import atexit
from model.rotation_system import RotationSystemDAO

class SchedulerService:
    """
    A service that manages all background tasks in the application.
    This is a singleton that should be initialized with the app.
    """
   
    def __init__(self):
        self.scheduler = None
        self.initialized = False
   
    def init_app(self, app: Flask):
        """Initialize the scheduler with the Flask app."""
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
        db_path = 'data.db'
       
        self._setup_rotation_jobs(db_path)
        self.scheduler.start()
       
        # Register with atexit to ensure shutdown happens on app termination
        # This is enough for clean shutdown - we don't need teardown_appcontext
        atexit.register(self._shutdown_scheduler)
       
        self.initialized = True
        print("Scheduler service initialized")
   
    def _setup_rotation_jobs(self, db_path):
        """Set up background jobs for the rotation system."""
        dao = RotationSystemDAO(db_path)
       
        self.scheduler.add_job(
            dao.process_scheduled_images,
            'interval',
            seconds=5,
            id='process_scheduled_images'
        )
       
        self.scheduler.add_job(
            dao.clean_expired_images,
            'interval',
            minutes=1,
            id='clean_expired_images'
        )
       
        # Check rotation every second
        self.scheduler.add_job(
            dao.check_rotation,
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
        """Add a job to the scheduler."""
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