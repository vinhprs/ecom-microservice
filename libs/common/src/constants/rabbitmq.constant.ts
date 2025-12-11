export const RABBITMQ_EXCHANGES = {
  USER_EVENTS: 'user.events',
  PRODUCT_EVENTS: 'product.events',
  ORDER_EVENTS: 'order.events',
  NOTIFICATION_EVENTS: 'notification.events',
  PAYMENT_EVENTS: 'payment.events',
  DLX_USER_EVENTS: 'dlx.user.events',
};

export const RABBITMQ_USERS_ROUTING_KEYS = {
  // CORE
  REGISTERED: 'user.profile.registered',
  PROFILE_FAILED: 'user.profile.failed',
  UPDATED: 'user.profile.updated',
  DELETED: 'user.profile.deleted',
};

export const RABBITMQ_USERS_QUEUES = {
  PROFILE: 'users-profile.queue',
  PROFILE_FAILED: 'users-profile.failed.queue',
};
