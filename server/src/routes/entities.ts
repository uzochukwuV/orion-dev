import { Router, Request, Response, NextFunction } from 'express';
import { Model, Document } from 'mongoose';

/**
 * Creates a generic CRUD router for a given Mongoose model.
 *
 * Mounted routes:
 *   GET    /          – list all, supports ?sort=<field>&limit=<n>
 *   GET    /:id       – find by ID
 *   POST   /          – create (auto-sets createdAt via Mongoose timestamps)
 *   PUT    /:id       – partial update by ID
 *   DELETE /:id       – delete by ID
 */
export function createEntityRouter<T extends Document>(Model: Model<T>): Router {
  const router = Router();

  // GET / — list with optional sort and limit
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sort = (req.query.sort as string) ?? '-createdAt';
      const limit = parseInt((req.query.limit as string) ?? '100', 10);

      // Build sort object: leading '-' means descending
      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;

      const docs = await Model.find()
        .sort({ [sortField]: sortOrder })
        .limit(limit)
        .lean();

      res.json(docs);
    } catch (err) {
      next(err);
    }
  });

  // GET /:id — find by ID
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await Model.findById(req.params.id).lean();
      if (!doc) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json(doc);
    } catch (err) {
      next(err);
    }
  });

  // POST / — create
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Mongoose timestamps option auto-sets createdAt / updatedAt
      const doc = await Model.create(req.body);
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  });

  // PUT /:id — partial update (merge)
  router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await Model.findByIdAndUpdate(
        req.params.id,
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

  // DELETE /:id — delete by ID
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id).lean();
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
