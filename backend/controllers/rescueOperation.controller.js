import RescueOperation from '../models/rescueOperation.model.js';

/**
 * @desc    Get all rescue operations
 * @route   GET /api/rescue-operations
 * @access  Public
 */
export const getAllRescueOperations = async (req, res, next) => {
  try {
    const { status, priority, organization } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (organization) filter.organization = new RegExp(organization, 'i');

    const operations = await RescueOperation.find(filter).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: operations.length,
      data: operations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single rescue operation by ID
 * @route   GET /api/rescue-operations/:id
 * @access  Public
 */
export const getRescueOperationById = async (req, res, next) => {
  try {
    const operation = await RescueOperation.findById(req.params.id);

    if (!operation) {
      return res.status(404).json({
        success: false,
        message: 'Rescue operation not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: operation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get rescue operations for a specific disaster
 * @route   GET /api/disasters/:disasterId/rescue-operations
 * @access  Public
 */
export const getDisasterRescueOperations = async (req, res, next) => {
  try {
    const { disasterId } = req.params;

    if (!disasterId) {
      return res.status(400).json({
        success: false,
        message: 'Disaster ID is required.',
      });
    }

    const operations = await RescueOperation.find({ disasterId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      disasterId,
      count: operations.length,
      data: operations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new rescue operation
 * @route   POST /api/rescue-operations
 * @access  Public (Admin/Rescuer in production)
 */
export const createRescueOperation = async (req, res, next) => {
  try {
    const {
      disasterId,
      title,
      description,
      location,
      status,
      priority,
      organization,
      teamsDeployed,
      peopleRescued,
      peopleInjured,
      peopleMissing,
      startedAt,
      source,
      sourceUrl,
      verified,
    } = req.body;

    if (!disasterId || !title) {
      return res.status(400).json({
        success: false,
        message: 'disasterId and title are required fields.',
      });
    }

    const operation = await RescueOperation.create({
      disasterId,
      title,
      description,
      location,
      status: status || 'active',
      priority: priority || 'high',
      organization: organization || 'National Disaster Response Force (NDRF)',
      teamsDeployed: teamsDeployed || 1,
      peopleRescued: peopleRescued || 0,
      peopleInjured: peopleInjured || 0,
      peopleMissing: peopleMissing || 0,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      source: source || 'Official Emergency Command Center',
      sourceUrl: sourceUrl || null,
      verified: verified !== undefined ? Boolean(verified) : true,
    });

    res.status(201).json({
      success: true,
      message: 'Rescue operation successfully created.',
      data: operation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a rescue operation
 * @route   PUT /api/rescue-operations/:id
 * @access  Public (Admin/Rescuer in production)
 */
export const updateRescueOperation = async (req, res, next) => {
  try {
    const operation = await RescueOperation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!operation) {
      return res.status(404).json({
        success: false,
        message: 'Rescue operation not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rescue operation successfully updated.',
      data: operation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a rescue operation
 * @route   DELETE /api/rescue-operations/:id
 * @access  Public (Admin/Rescuer in production)
 */
export const deleteRescueOperation = async (req, res, next) => {
  try {
    const operation = await RescueOperation.findByIdAndDelete(req.params.id);

    if (!operation) {
      return res.status(404).json({
        success: false,
        message: 'Rescue operation not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rescue operation deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
