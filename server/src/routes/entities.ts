import { Router, Request, Response, NextFunction } from 'express';
import { Model, Document } from 'mongoose';
import { verifyJWT } from '../auth/middleware.js';

/**
 * Creates a generic CRUD router for a given Mongoose model.
 * All operations are scoped to the authenticated user's business.
 *
 * Mounted routes:
 *   GET    /          – list all for business, supports ?sort=<field>&limit=<n>
 *   GET    /:id       – find by ID within business
 *   POST   /          – create (auto-sets createdAt via Mongoose timestamps)
 *   PUT    /:id       – partial update by ID
 *   DELETE /:id       – delete by ID
 */
export function createEntityRouter<T extends Document>(Model: Model<T>): Router {
  const router = Router();

  // Helper to get business_id from JWT
  const getBusinessId = (req: Request): string => {
    return (req as any).user?.businessId || (req as any).user?.business_id || '';
  };

  // GET / — list with optional sort and limit (scoped to business)
  router.get('/', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = getBusinessId(req);
      const sort = (req.query.sort as string) ?? '-createdAt';
      const limit = parseInt((req.query.limit as string) ?? '100', 10);

      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;

      const docs = await Model.find({ business_id: businessId })
        .sort({ [sortField]: sortOrder })
        .limit(limit)
        .lean();

      res.json(docs);
    } catch (err) {
      next(err);
    }
  });

  // GET /:id — find by ID within business
  router.get('/:id', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = getBusinessId(req);
      const doc = await Model.findOne({ _id: req.params.id, business_id: businessId }).lean();
      if (!doc) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json(doc);
    } catch (err) {
      next(err);
    }
  });

  // POST / — create (auto-set business_id)
  router.post('/', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = getBusinessId(req);
      const doc = await Model.create({
        ...req.body,
        business_id: req.body.business_id || businessId,
      });
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  });

  // PUT /:id — partial update (merge) within business
  router.put('/:id', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = getBusinessId(req);
      const doc = await Model.findOneAndUpdate(
        { _id: req.params.id, business_id: businessId },
        { $set: req.body },
        { new: true, runValidators: true }
      ).lean();

      if (!doc) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json(doc);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /:id — delete by ID within business
  router.delete('/:id', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = getBusinessId(req);
      const doc = await Model.findOneAndDelete({ _id: req.params.id, business_id: businessId }).lean();
      if (!doc) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
