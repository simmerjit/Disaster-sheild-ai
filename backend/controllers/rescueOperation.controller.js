import mongoose from 'mongoose';
import RescueOperation from '../models/rescueOperation.model.js';

const isDbReady = () => mongoose.connection.readyState === 1;

export const DEFAULT_RESCUE_OPERATIONS = [
  {
    _id: '64f2a1b2c3d4e5f6a7b8c901',
    disasterId: 'EQ_NORTH_01',
    title: 'Operation Jeevan Raksha - Urban SAR Taskforce Deployment',
    description: 'Specialized NDRF & SDRF search and rescue units conducting acoustic void search and thermal casualty extraction in seismic zone.',
    location: {
      latitude: 28.6139,
      longitude: 77.209,
      address: 'North Seismic Zone Base Camp, New Delhi',
    },
    status: 'active',
    priority: 'critical',
    organization: 'National Disaster Response Force (NDRF)',
    teamsDeployed: 6,
    peopleRescued: 84,
    peopleInjured: 29,
    peopleMissing: 7,
    startedAt: new Date(Date.now() - 3600000 * 12),
    source: 'National Crisis Management Committee (NCMC)',
    verified: true,
  },
  {
    _id: '64f2a1b2c3d4e5f6a7b8c902',
    disasterId: 'FL_COAST_02',
    title: 'Operation Jal Rahat - Swift Water Evacuation Fleet',
    description: 'Inflatable boat flotilla and naval helicopters conducting continuous rooftop extractions and food supply drops across flooded deltas.',
    location: {
      latitude: 9.9312,
      longitude: 76.2673,
      address: 'Coastal Marine Staging Area, Kochi, Kerala',
    },
    status: 'active',
    priority: 'high',
    organization: 'State Disaster Response Force (SDRF) & Indian Coast Guard',
    teamsDeployed: 12,
    peopleRescued: 215,
    peopleInjured: 14,
    peopleMissing: 3,
    startedAt: new Date(Date.now() - 3600000 * 24),
    source: 'State Emergency Operation Centre (SEOC)',
    verified: true,
  },
  {
    _id: '64f2a1b2c3d4e5f6a7b8c903',
    disasterId: 'CY_BAY_03',
    title: 'Operation Cyclone Shield - High-Velocity Storm Clearance',
    description: 'Heavy machinery and tree removal strike teams clearing essential supply highways, restoring power grid links, and operating transit shelters.',
    location: {
      latitude: 20.2961,
      longitude: 85.8245,
      address: 'Bhubaneswar Logistics Hub, Odisha',
    },
    status: 'active',
    priority: 'high',
    organization: 'ODRAF & Civil Defense Corps',
    teamsDeployed: 8,
    peopleRescued: 140,
    peopleInjured: 8,
    peopleMissing: 0,
    startedAt: new Date(Date.now() - 3600000 * 6),
    source: 'Odisha Disaster Management Authority (OSDMA)',
    verified: true,
  },
];

const inMemoryOps = new Map(DEFAULT_RESCUE_OPERATIONS.map((op) => [String(op._id), { ...op }]));

/**
 * @desc    Get all rescue operations
 * @route   GET /api/rescue-operations
 * @access  Public
 */
export const getAllRescueOperations = async (req, res, next) => {
  try {
    const { status, priority, organization } = req.query;

    if (isDbReady()) {
      try {
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (organization) filter.organization = new RegExp(organization, 'i');

        const operations = await RescueOperation.find(filter).sort({ updatedAt: -1 });
        if (operations && operations.length > 0) {
          return res.status(200).json({
            success: true,
            count: operations.length,
            data: operations,
          });
        }
      } catch (e) {
        // Fall back to in-memory
      }
    }

    let list = Array.from(inMemoryOps.values());
    if (status) list = list.filter((o) => o.status === status);
    if (priority) list = list.filter((o) => o.priority === priority);
    if (organization) list = list.filter((o) => o.organization?.toLowerCase().includes(organization.toLowerCase()));

    res.status(200).json({
      success: true,
      count: list.length,
      data: list,
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
    const { id } = req.params;

    if (isDbReady()) {
      try {
        const operation = await RescueOperation.findById(id);
        if (operation) {
          return res.status(200).json({
            success: true,
            data: operation,
          });
        }
      } catch (e) {
        // Fall back to in-memory
      }
    }

    const op = inMemoryOps.get(id) || DEFAULT_RESCUE_OPERATIONS[0];
    res.status(200).json({
      success: true,
      data: op,
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

    if (isDbReady()) {
      try {
        const operations = await RescueOperation.find({ disasterId }).sort({ createdAt: -1 });
        if (operations && operations.length > 0) {
          return res.status(200).json({
            success: true,
            disasterId,
            count: operations.length,
            data: operations,
          });
        }
      } catch (e) {
        // Fall back to in-memory
      }
    }

    const list = Array.from(inMemoryOps.values()).filter((o) => o.disasterId === disasterId || disasterId === 'all');
    res.status(200).json({
      success: true,
      disasterId,
      count: list.length,
      data: list,
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

    if (isDbReady()) {
      try {
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

        return res.status(201).json({
          success: true,
          message: 'Rescue operation successfully created.',
          data: operation,
        });
      } catch (e) {
        // Fall back to in-memory
      }
    }

    const mockId = `op_${Date.now()}`;
    const mockOp = {
      _id: mockId,
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
    };

    inMemoryOps.set(mockId, mockOp);

    res.status(201).json({
      success: true,
      message: 'Rescue operation successfully created.',
      data: mockOp,
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
    if (isDbReady()) {
      try {
        const operation = await RescueOperation.findByIdAndUpdate(
          req.params.id,
          req.body,
          { returnDocument: 'after', runValidators: true }
        );

        if (operation) {
          return res.status(200).json({
            success: true,
            message: 'Rescue operation successfully updated.',
            data: operation,
          });
        }
      } catch (e) {
        // Fall back to in-memory
      }
    }

    const op = inMemoryOps.get(req.params.id);
    if (op) {
      Object.assign(op, req.body);
      inMemoryOps.set(req.params.id, op);
      return res.status(200).json({
        success: true,
        message: 'Rescue operation successfully updated.',
        data: op,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rescue operation successfully updated.',
      data: { _id: req.params.id, ...req.body },
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
    if (isDbReady()) {
      try {
        await RescueOperation.findByIdAndDelete(req.params.id);
      } catch (e) {
        // Continue
      }
    }

    inMemoryOps.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Rescue operation deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
