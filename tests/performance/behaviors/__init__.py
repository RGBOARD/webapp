"""
Behavior modules for Locust load testing of RGBOARD application.

This package contains task sets that simulate different user behaviors:
- UserBehavior: Base behavior for all users
- RegularUserBehavior: Tasks specific to non-admin users
- AdminUserBehavior: Tasks specific to admin users
"""

from tests.performance.behaviors.user_behavior import UserBehavior
from tests.performance.behaviors.regular_user_behavior import RegularUserBehavior
from tests.performance.behaviors.admin_user_behavior import AdminUserBehavior

__all__ = ['UserBehavior', 'RegularUserBehavior', 'AdminUserBehavior']
