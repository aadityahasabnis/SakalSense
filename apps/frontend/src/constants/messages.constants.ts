// =============================================
// Messages Constants — Reusable UI Text
// =============================================

// Button labels
export const BUTTON_LABEL = {
    SAVE: 'Save',
    CANCEL: 'Cancel',
    DELETE: 'Delete',
    EDIT: 'Edit',
    CREATE: 'Create',
    SUBMIT: 'Submit',
    PUBLISH: 'Publish',
    ARCHIVE: 'Archive',
    CLOSE: 'Close',
    CONFIRM: 'Confirm',
    BACK: 'Back',
    NEXT: 'Next',
    PREVIOUS: 'Previous',
    VIEW: 'View',
    VIEW_ALL: 'View All',
    LEARN_MORE: 'Learn More',
    GET_STARTED: 'Get Started',
    ENROLL: 'Enroll Now',
    CONTINUE: 'Continue Learning',
    START: 'Start',
    RESUME: 'Resume',
} as const;

// Loading states
export const LOADING_LABEL = {
    LOADING: 'Loading...',
    SAVING: 'Saving...',
    SUBMITTING: 'Submitting...',
    PUBLISHING: 'Publishing...',
    DELETING: 'Deleting...',
    PROCESSING: 'Processing...',
} as const;

// Status messages
export const STATUS_MESSAGE = {
    SUCCESS: 'Operation successful',
    ERROR: 'Something went wrong',
    SAVED: 'Changes saved successfully',
    DELETED: 'Successfully deleted',
    PUBLISHED: 'Content published successfully',
    ARCHIVED: 'Content archived successfully',
    ENROLLED: 'Successfully enrolled',
    COMPLETED: 'Completed successfully',
} as const;

// Empty state messages
export const EMPTY_STATE = {
    NO_DATA: 'No data available',
    NO_RESULTS: 'No results found',
    NO_CONTENT: 'No content yet',
    NO_COURSES: 'No courses available',
    NO_ARTICLES: 'No articles yet',
    NO_BLOGS: 'No blog posts yet',
    NO_BOOKMARKS: 'No bookmarks yet',
    NO_PROGRESS: 'Start learning to track your progress',
    NO_COMMENTS: 'No comments yet. Be the first to comment!',
    NO_NOTIFICATIONS: 'No new notifications',
    START_SEARCH: 'Start typing to search...',
} as const;

// Confirmation messages
export const CONFIRM_MESSAGE = {
    DELETE: 'Are you sure you want to delete this?',
    ARCHIVE: 'Are you sure you want to archive this?',
    PUBLISH: 'Are you sure you want to publish this?',
    DISCARD: 'Discard unsaved changes?',
    LOGOUT: 'Are you sure you want to logout?',
    UNENROLL: 'Are you sure you want to unenroll?',
} as const;

// Error messages
export const ERROR_MESSAGE = {
    REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email',
    INVALID_PASSWORD: 'Password must be at least 8 characters',
    PASSWORDS_MISMATCH: 'Passwords do not match',
    INVALID_URL: 'Please enter a valid URL',
    FILE_TOO_LARGE: 'File size exceeds the limit',
    INVALID_FILE_TYPE: 'Invalid file type',
    NETWORK_ERROR: 'Network error. Please try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    NOT_FOUND: 'Resource not found',
} as const;

// Success messages
export const SUCCESS_MESSAGE = {
    LOGIN: 'Logged in successfully',
    LOGOUT: 'Logged out successfully',
    REGISTER: 'Registration successful',
    PASSWORD_RESET: 'Password reset successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    CONTENT_CREATED: 'Content created successfully',
    CONTENT_UPDATED: 'Content updated successfully',
    COMMENT_ADDED: 'Comment added successfully',
    BOOKMARKED: 'Added to bookmarks',
    UNBOOKMARKED: 'Removed from bookmarks',
} as const;
