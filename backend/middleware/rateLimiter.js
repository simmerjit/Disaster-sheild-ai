/**
 * @module middleware/rateLimiter
 * @desc Scalable sliding-window rate limiter with high burst tolerance for emergency services
 */

class RateLimiter {
  constructor({ windowMs = 60 * 1000, maxRequests = 300, message = 'Too many requests' } = {}) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message;
    this.hits = new Map();

    // Periodic sweep to clean up expired IPs and avoid memory leaks
    setInterval(() => this.cleanup(), this.windowMs);
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, data] of this.hits.entries()) {
      if (now - data.startTime > this.windowMs) {
        this.hits.delete(ip);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      // Exclude internal health checks or CORS preflight
      if (req.method === 'OPTIONS' || req.path === '/' || req.path === '/api/health') {
        return next();
      }

      const ip =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        'unknown_ip';

      const now = Date.now();
      let record = this.hits.get(ip);

      if (!record || now - record.startTime > this.windowMs) {
        record = { count: 1, startTime: now };
        this.hits.set(ip, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, this.maxRequests - record.count);
      const resetTime = Math.ceil((record.startTime + this.windowMs - now) / 1000);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime);

      if (record.count > this.maxRequests) {
        return res.status(429).json({
          success: false,
          error: this.message,
          retryAfterSeconds: resetTime,
        });
      }

      next();
    };
  }
}

// Default API rate limiter (300 req/min per IP)
export const globalRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 300,
  message: 'API rate limit exceeded. Please wait a moment before sending more requests.',
}).middleware();

// Chatbot specific rate limiter (60 queries/min per IP)
export const chatRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Chat query rate limit reached. Please wait before asking more questions.',
}).middleware();

export default RateLimiter;
