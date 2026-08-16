import DisasterUpdate from '../models/update.model.js';

/**
 * @desc    Get verified updates/alerts for a specific disaster
 * @route   GET /api/disasters/:disasterId/updates
 * @access  Public
 */
export const getDisasterUpdates = async (req, res, next) => {
  try {
    const { disasterId } = req.params;

    if (!disasterId) {
      return res.status(400).json({
        success: false,
        message: 'Disaster ID is required.',
      });
    }

    const updates = await DisasterUpdate.find({ disasterId }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      disasterId,
      count: updates.length,
      data: updates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new verified update/alert for a disaster
 * @route   POST /api/disasters/:disasterId/updates
 * @access  Public (Admin/Authority in production)
 */
export const createDisasterUpdate = async (req, res, next) => {
  try {
    const { disasterId } = req.params;
    const { title, content, source, sourceUrl, type, verified, timestamp } = req.body;

    if (!disasterId || !title || !content || !source) {
      return res.status(400).json({
        success: false,
        message: 'disasterId, title, content, and source are required fields.',
      });
    }

    const newUpdate = await DisasterUpdate.create({
      disasterId,
      title,
      content,
      source,
      sourceUrl: sourceUrl || null,
      type: type || 'general',
      verified: verified !== undefined ? Boolean(verified) : true,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Disaster update successfully published.',
      data: newUpdate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing disaster update/alert
 * @route   PUT /api/disasters/:disasterId/updates/:updateId
 * @access  Public (Admin/Authority in production)
 */
export const updateDisasterUpdate = async (req, res, next) => {
  try {
    const { disasterId, updateId } = req.params;

    const update = await DisasterUpdate.findOneAndUpdate(
      { _id: updateId, disasterId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Update record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Disaster update successfully modified.',
      data: update,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a disaster update/alert
 * @route   DELETE /api/disasters/:disasterId/updates/:updateId
 * @access  Public (Admin/Authority in production)
 */
export const deleteDisasterUpdate = async (req, res, next) => {
  try {
    const { disasterId, updateId } = req.params;

    const result = await DisasterUpdate.findOneAndDelete({ _id: updateId, disasterId });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Update record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Disaster update deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
