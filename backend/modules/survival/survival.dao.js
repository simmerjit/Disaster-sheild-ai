import SurvivalContent from './survival.model.js';

class SurvivalDAO {
  /**
   * Create new survival content record
   */
  async create(data) {
    return await SurvivalContent.create(data);
  }

  /**
   * Insert multiple survival content records (for seeding/defaults)
   */
  async insertMany(items) {
    return await SurvivalContent.insertMany(items, { ordered: false });
  }

  /**
   * Find single item by ID
   */
  async findById(id) {
    return await SurvivalContent.findById(id);
  }

  /**
   * Find items matching query filters with sorting & pagination
   */
  async find(filter = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = { createdAt: -1 },
      select = '',
    } = options;

    const skip = (page - 1) * limit;

    const query = SurvivalContent.find(filter)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const [items, total] = await Promise.all([
      query.exec(),
      SurvivalContent.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Update survival content by ID
   */
  async updateById(id, updateData) {
    return await SurvivalContent.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });
  }

  /**
   * Delete survival content by ID
   */
  async deleteById(id) {
    return await SurvivalContent.findByIdAndDelete(id);
  }

  /**
   * Increment view counter atomically
   */
  async incrementViews(id) {
    return await SurvivalContent.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    );
  }

  /**
   * Increment like counter atomically
   */
  async incrementLikes(id) {
    return await SurvivalContent.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { returnDocument: 'after' }
    );
  }

  /**
   * Count documents matching filter
   */
  async count(filter = {}) {
    return await SurvivalContent.countDocuments(filter);
  }

  /**
   * Get category aggregate metrics
   */
  async getCategoryStats() {
    return await SurvivalContent.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }

  /**
   * Get disaster type aggregate metrics
   */
  async getDisasterTypeStats() {
    return await SurvivalContent.aggregate([
      {
        $group: {
          _id: '$disasterType',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }
}

export default new SurvivalDAO();
