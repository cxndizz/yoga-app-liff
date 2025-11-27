const EventEmitter = require('events');

/**
 * Central event bus for broadcasting data changes
 * This allows decoupling between routes and WebSocket server
 */
class AppEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Support many listeners for high concurrency
  }

  /**
   * Emit a payment-related event
   * @param {string} eventType - 'created' | 'updated' | 'completed' | 'failed'
   * @param {object} data - Payment data
   */
  emitPaymentEvent(eventType, data) {
    this.emit('payment', { type: eventType, data });
    this.emit(`payment:${eventType}`, data);
  }

  /**
   * Emit an order-related event
   * @param {string} eventType - 'created' | 'updated' | 'completed' | 'cancelled'
   * @param {object} data - Order data
   */
  emitOrderEvent(eventType, data) {
    this.emit('order', { type: eventType, data });
    this.emit(`order:${eventType}`, data);
  }

  /**
   * Emit an enrollment-related event
   * @param {string} eventType - 'created' | 'updated' | 'cancelled'
   * @param {object} data - Enrollment data
   */
  emitEnrollmentEvent(eventType, data) {
    this.emit('enrollment', { type: eventType, data });
    this.emit(`enrollment:${eventType}`, data);
  }

  /**
   * Emit a course-related event
   * @param {string} eventType - 'created' | 'updated' | 'deleted'
   * @param {object} data - Course data
   */
  emitCourseEvent(eventType, data) {
    this.emit('course', { type: eventType, data });
    this.emit(`course:${eventType}`, data);
  }

  /**
   * Emit a dashboard refresh event
   */
  emitDashboardRefresh() {
    this.emit('dashboard:refresh', { timestamp: new Date() });
  }

  /**
   * Emit a session-related event
   * @param {string} eventType - 'created' | 'updated' | 'cancelled'
   * @param {object} data - Session data
   */
  emitSessionEvent(eventType, data) {
    this.emit('session', { type: eventType, data });
    this.emit(`session:${eventType}`, data);
  }
}

// Create a singleton instance
const eventBus = new AppEventBus();

module.exports = eventBus;
