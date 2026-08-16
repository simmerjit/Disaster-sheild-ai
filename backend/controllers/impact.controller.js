import DisasterImpact from '../models/impact.model.js';

/**
 * @desc    Get verified impact & casualty statistics for a disaster
 * @route   GET /api/disasters/:disasterId/impact
 * @access  Public
 */
export const getDisasterImpact = async (req, res, next) => {
  try {
    const { disasterId } = req.params;

    if (!disasterId) {
      return res.status(400).json({
        success: false,
        message: 'Disaster ID parameter is required.',
      });
    }

    const impact = await DisasterImpact.findOne({ disasterId });

    if (!impact) {
      return res.status(200).json({
        success: true,
        disasterId,
        impact: null,
        message: 'No impact or casualty data currently recorded for this disaster.',
      });
    }

    res.status(200).json({
      success: true,
      disasterId,
      impact: {
        id: impact._id,
        disasterId: impact.disasterId,
        affected: impact.affected,
        rescued: impact.rescued,
        injured: impact.injured,
        missing: impact.missing,
        deceased: impact.deceased,
        source: impact.source,
        sourceUrl: impact.sourceUrl,
        verified: impact.verified,
        updatedAt: impact.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update impact & casualty statistics for a disaster
 * @route   POST /api/disasters/:disasterId/impact
 *          PUT /api/disasters/:disasterId/impact
 * @access  Public (Admin/Authority in production)
 */
export const createOrUpdateDisasterImpact = async (req, res, next) => {
  try {
    const { disasterId } = req.params;
    const { affected, rescued, injured, missing, deceased, source, sourceUrl, verified } = req.body;

    if (!disasterId) {
      return res.status(400).json({
        success: false,
        message: 'Disaster ID is required.',
      });
    }

    if (!source) {
      return res.status(400).json({
        success: false,
        message: 'Official source is required for impact statistics.',
      });
    }

    const updatePayload = {
      disasterId,
      affected: affected !== undefined && affected !== '' ? Number(affected) : null,
      rescued: rescued !== undefined && rescued !== '' ? Number(rescued) : null,
      injured: injured !== undefined && injured !== '' ? Number(injured) : null,
      missing: missing !== undefined && missing !== '' ? Number(missing) : null,
      deceased: deceased !== undefined && deceased !== '' ? Number(deceased) : null,
      source,
      sourceUrl: sourceUrl || null,
      verified: verified !== undefined ? Boolean(verified) : true,
      updatedAt: new Date(),
    };

    const impact = await DisasterImpact.findOneAndUpdate(
      { disasterId },
      updatePayload,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Disaster impact statistics successfully updated.',
      impact,
    });
  } catch (error) {
    next(error);
  }
};
