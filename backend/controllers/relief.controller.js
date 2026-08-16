import ReliefOrganization from '../models/relief.model.js';

/**
 * @desc    Get all verified relief/donation organizations (supports ?area= & ?service= & ?verified=)
 * @route   GET /api/relief-organizations
 * @access  Public
 */
export const getAllReliefOrganizations = async (req, res, next) => {
  try {
    const { area, service, verified, active } = req.query;
    const filter = {};

    if (active !== undefined) {
      filter.active = active === 'true';
    } else {
      filter.active = true;
    }

    if (verified !== undefined) {
      filter.verified = verified === 'true';
    }

    if (area) {
      filter.areasSupported = { $regex: new RegExp(area, 'i') };
    }

    if (service) {
      filter.services = service.toLowerCase();
    }

    const organizations = await ReliefOrganization.find(filter).sort({ verified: -1, name: 1 });

    res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single relief organization by ID
 * @route   GET /api/relief-organizations/:id
 * @access  Public
 */
export const getReliefOrganizationById = async (req, res, next) => {
  try {
    const organization = await ReliefOrganization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Relief organization not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new relief organization
 * @route   POST /api/relief-organizations
 * @access  Public (Admin in production)
 */
export const createReliefOrganization = async (req, res, next) => {
  try {
    const {
      name,
      description,
      website,
      donationUrl,
      logo,
      services,
      areasSupported,
      verified,
      verificationSource,
      verificationUrl,
      active,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Organization name is required.',
      });
    }

    const organization = await ReliefOrganization.create({
      name,
      description,
      website,
      donationUrl,
      logo,
      services: services || [],
      areasSupported: areasSupported || [],
      verified: verified !== undefined ? Boolean(verified) : false,
      verificationSource,
      verificationUrl,
      active: active !== undefined ? Boolean(active) : true,
    });

    res.status(201).json({
      success: true,
      message: 'Relief organization created successfully.',
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a relief organization
 * @route   PUT /api/relief-organizations/:id
 * @access  Public (Admin in production)
 */
export const updateReliefOrganization = async (req, res, next) => {
  try {
    const organization = await ReliefOrganization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Relief organization not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Relief organization updated successfully.',
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a relief organization
 * @route   DELETE /api/relief-organizations/:id
 * @access  Public (Admin in production)
 */
export const deleteReliefOrganization = async (req, res, next) => {
  try {
    const organization = await ReliefOrganization.findByIdAndDelete(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Relief organization not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Relief organization deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
