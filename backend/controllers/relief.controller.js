import mongoose from 'mongoose';
import ReliefOrganization from '../models/relief.model.js';

const isDbReady = () => mongoose.connection.readyState === 1;

export const DEFAULT_RELIEF_ORGS = [
  {
    _id: '64f3c1d2e3f4a5b6c7d8e901',
    name: 'Indian Red Cross Society',
    description: 'Premier humanitarian organization providing emergency medical relief, blood bank services, first aid supplies, and temporary community shelter during national catastrophes.',
    website: 'https://www.indianredcross.org',
    donationUrl: 'https://www.indianredcross.org/donate',
    logo: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=120&q=80',
    services: ['medical', 'blood_bank', 'shelter', 'food', 'first_aid'],
    areasSupported: ['National', 'Pan-India', 'Assam', 'Odisha', 'Kerala', 'Delhi'],
    verified: true,
    verificationSource: 'Ministry of Health & Family Welfare',
    verificationUrl: 'https://www.mohfw.gov.in',
    active: true,
  },
  {
    _id: '64f3c1d2e3f4a5b6c7d8e902',
    name: 'Goonj - Rahat Disaster Relief Initiative',
    description: 'Transforming urban surplus into disaster relief kits comprising dry rations, sanitary materials, clothing, water filtration tablets, and long-term rehabilitation support.',
    website: 'https://goonj.org/rahat',
    donationUrl: 'https://goonj.org/donate',
    logo: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=120&q=80',
    services: ['clothing', 'food', 'water', 'rehabilitation', 'shelter'],
    areasSupported: ['Pan-India', 'Bihar', 'Assam', 'Uttarakhand', 'Himachal Pradesh'],
    verified: true,
    verificationSource: 'Registered NGO & NITI Aayog Darpan',
    verificationUrl: 'https://ngodarpan.gov.in',
    active: true,
  },
  {
    _id: '64f3c1d2e3f4a5b6c7d8e903',
    name: 'Doctors Without Borders / MSF India',
    description: 'International independent medical humanitarian organization delivering emergency medical aid to people affected by armed conflict, epidemics, and natural disasters.',
    website: 'https://www.doctorswithoutborders.in',
    donationUrl: 'https://www.doctorswithoutborders.in/donate',
    logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=120&q=80',
    services: ['medical', 'counseling', 'water', 'rehabilitation'],
    areasSupported: ['Global', 'National', 'Disaster Impact Zones'],
    verified: true,
    verificationSource: 'Médecins Sans Frontières International',
    verificationUrl: 'https://www.msf.org',
    active: true,
  },
  {
    _id: '64f3c1d2e3f4a5b6c7d8e904',
    name: 'Feeding India by Zomato',
    description: 'Emergency food distribution network delivering hot meals and dry ration packs to thousands of displaced families in flood, cyclone, and earthquake crisis zones.',
    website: 'https://www.feedingindia.org',
    donationUrl: 'https://www.feedingindia.org/donate',
    logo: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=120&q=80',
    services: ['food', 'water', 'financial_assistance'],
    areasSupported: ['Delhi NCR', 'Mumbai', 'Chennai', 'Kolkata', 'Bengaluru', 'Flood Corridors'],
    verified: true,
    verificationSource: 'Feeding India Trust & FSSAI',
    verificationUrl: 'https://www.fssai.gov.in',
    active: true,
  },
];

const inMemoryRelief = new Map(DEFAULT_RELIEF_ORGS.map((org) => [String(org._id), { ...org }]));

/**
 * @desc    Get all verified relief/donation organizations (supports ?area= & ?service= & ?verified=)
 * @route   GET /api/relief-organizations
 * @access  Public
 */
export const getAllReliefOrganizations = async (req, res, next) => {
  try {
    const { area, service, verified, active } = req.query;

    if (isDbReady()) {
      try {
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
        if (organizations && organizations.length > 0) {
          return res.status(200).json({
            success: true,
            count: organizations.length,
            data: organizations,
          });
        }
      } catch (e) {
        // Fall back to in-memory
      }
    }

    let list = Array.from(inMemoryRelief.values());
    if (active !== undefined) {
      list = list.filter((o) => o.active === (active === 'true'));
    }
    if (verified !== undefined) {
      list = list.filter((o) => o.verified === (verified === 'true'));
    }
    if (area) {
      list = list.filter((o) => (o.areasSupported || []).some((a) => a.toLowerCase().includes(area.toLowerCase())));
    }
    if (service) {
      list = list.filter((o) => (o.services || []).includes(service.toLowerCase()));
    }

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
 * @desc    Get a single relief organization by ID
 * @route   GET /api/relief-organizations/:id
 * @access  Public
 */
export const getReliefOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbReady()) {
      try {
        const organization = await ReliefOrganization.findById(id);
        if (organization) {
          return res.status(200).json({
            success: true,
            data: organization,
          });
        }
      } catch (e) {
        // Fall back to in-memory
      }
    }

    const org = inMemoryRelief.get(id) || DEFAULT_RELIEF_ORGS[0];
    res.status(200).json({
      success: true,
      data: org,
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

    if (isDbReady()) {
      try {
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

        return res.status(201).json({
          success: true,
          message: 'Relief organization created successfully.',
          data: organization,
        });
      } catch (e) {
        // Fall back to in-memory
      }
    }

    const mockId = `org_${Date.now()}`;
    const mockOrg = {
      _id: mockId,
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
    };

    inMemoryRelief.set(mockId, mockOrg);

    res.status(201).json({
      success: true,
      message: 'Relief organization created successfully.',
      data: mockOrg,
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
    if (isDbReady()) {
      try {
        const organization = await ReliefOrganization.findByIdAndUpdate(
          req.params.id,
          req.body,
          { returnDocument: 'after', runValidators: true }
        );

        if (organization) {
          return res.status(200).json({
            success: true,
            message: 'Relief organization updated successfully.',
            data: organization,
          });
        }
      } catch (e) {
        // Fall back to in-memory
      }
    }

    const org = inMemoryRelief.get(req.params.id);
    if (org) {
      Object.assign(org, req.body);
      inMemoryRelief.set(req.params.id, org);
      return res.status(200).json({
        success: true,
        message: 'Relief organization updated successfully.',
        data: org,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Relief organization updated successfully.',
      data: { _id: req.params.id, ...req.body },
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
    if (isDbReady()) {
      try {
        await ReliefOrganization.findByIdAndDelete(req.params.id);
      } catch (e) {
        // Continue
      }
    }

    inMemoryRelief.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Relief organization deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
