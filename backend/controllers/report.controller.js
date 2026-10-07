import mongoose from 'mongoose';
import Report from '../models/report.model.js';
import User from '../models/user.model.js';
import Disaster from '../models/disaster.model.js';

const inMemoryReports = new Map([
  [
    'rep_demo_1',
    {
      _id: 'rep_demo_1',
      title: 'Flooded roadway near Old City Market',
      description:
        'Water level is rising rapidly and vehicles are stuck in the lower lane. Neighbors are requesting immediate route diversion support.',
      imageUrl: '',
      latitude: 28.6412,
      longitude: 77.2229,
      status: 'pending',
      user: 'user_demo_1',
      disaster: null,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      updatedAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  ],
  [
    'rep_demo_2',
    {
      _id: 'rep_demo_2',
      title: 'Power lines down after windstorm',
      description:
        'Multiple poles are damaged and there is an active spark hazard near the railway crossing.',
      imageUrl: '',
      latitude: 19.076,
      longitude: 72.8777,
      status: 'verified',
      user: 'user_demo_2',
      disaster: null,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 90 * 60 * 1000),
    },
  ],
]);

const getUserContext = async (req, explicitUserId) => {
  const databaseReady = mongoose.connection.readyState === 1;

  if (databaseReady && explicitUserId) {
    const existing = await User.findById(explicitUserId).catch(() => null);
    if (existing) return existing;
  }

  if (databaseReady && req.user?._id) {
    const existing = await User.findById(req.user._id).catch(() => null);
    if (existing) return existing;
  }

  const fallbackEmail = req.body?.email || `${Date.now()}@disastershield.local`;
  const fallbackName = req.body?.userName || req.user?.name || 'Citizen Reporter';

  if (!databaseReady) {
    return {
      _id: req.user?._id || 'user_guest',
      name: fallbackName,
      email: fallbackEmail.toLowerCase(),
    };
  }

  return User.findOneAndUpdate(
    { email: fallbackEmail.toLowerCase() },
    {
      $setOnInsert: {
        name: fallbackName,
        email: fallbackEmail.toLowerCase(),
        role: 'citizen',
        organization: 'Public Network',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const serializeReport = (report) => {
  if (!report) return null;

  const plain = typeof report.toObject === 'function' ? report.toObject() : report;
  return {
    ...plain,
    user: plain.user && typeof plain.user === 'object' ? plain.user : plain.user ? { _id: plain.user } : null,
  };
};

export const getAllReports = async (req, res, next) => {
  try {
    const { status, userId, disasterId, title, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (userId) filter.user = userId;
    if (disasterId) filter.disaster = disasterId;

    if (title || search) {
      const query = (title || search || '').trim();
      if (query) {
        filter.$or = [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ];
      }
    }

    if (mongoose.connection.readyState === 1) {
      const reports = await Report.find(filter)
        .populate('user', 'name email role organization')
        .populate('disaster', 'title type severity')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: reports.length,
        data: reports,
      });
    }

    const fallback = Array.from(inMemoryReports.values()).filter((report) => {
      if (status && report.status !== status) return false;
      if (userId && String(report.user) !== String(userId)) return false;
      if (disasterId && String(report.disaster || '') !== String(disasterId)) return false;
      if (title || search) {
        const q = (title || search || '').trim().toLowerCase();
        if (!q) return true;
        return (
          (report.title || '').toLowerCase().includes(q) ||
          (report.description || '').toLowerCase().includes(q)
        );
      }
      return true;
    });

    return res.status(200).json({
      success: true,
      count: fallback.length,
      data: fallback,
    });
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const report = await Report.findById(id)
        .populate('user', 'name email role organization')
        .populate('disaster', 'title type severity');

      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
      }

      return res.status(200).json({ success: true, data: report });
    }

    const report = inMemoryReports.get(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

export const createReport = async (req, res, next) => {
  try {
    const {
      title,
      description,
      imageUrl,
      latitude,
      longitude,
      disasterId,
      userName,
      email,
    } = req.body;

    if (
      typeof title !== 'string' ||
      typeof description !== 'string' ||
      !title.trim() ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required to create a report.',
      });
    }

    if (title.trim().length > 140 || description.trim().length > 3000) {
      return res.status(400).json({
        success: false,
        message: 'Report title must be 140 characters or fewer and description 3000 characters or fewer.',
      });
    }

    if (imageUrl && (typeof imageUrl !== 'string' || imageUrl.length > 2048)) {
      return res.status(400).json({ success: false, message: 'Image URL must be a string of 2048 characters or fewer.' });
    }

    if (imageUrl) {
      try {
        const parsedImageUrl = new URL(imageUrl);
        if (!['http:', 'https:'].includes(parsedImageUrl.protocol)) {
          throw new Error('Unsupported protocol');
        }
      } catch {
        return res.status(400).json({ success: false, message: 'Image URL must be a valid HTTP or HTTPS URL.' });
      }
    }

    if (latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required for an incident report.',
      });
    }

    const reportUser = await getUserContext(req, req.user?._id || null);

    const numericLatitude = latitude != null ? Number(latitude) : null;
    const numericLongitude = longitude != null ? Number(longitude) : null;
    if (
      (numericLatitude != null && (!Number.isFinite(numericLatitude) || numericLatitude < -90 || numericLatitude > 90)) ||
      (numericLongitude != null && (!Number.isFinite(numericLongitude) || numericLongitude < -180 || numericLongitude > 180))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90 and longitude between -180 and 180.',
      });
    }

    const normalizedDisasterId =
      disasterId && mongoose.Types.ObjectId.isValid(disasterId) ? disasterId : null;

    if (mongoose.connection.readyState === 1) {
      const report = await Report.create({
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl || '',
        latitude: numericLatitude,
        longitude: numericLongitude,
        status: 'pending',
        user: reportUser._id,
        disaster: normalizedDisasterId,
      });

      const populated = await Report.findById(report._id)
        .populate('user', 'name email role organization')
        .populate('disaster', 'title type severity');

      return res.status(201).json({
        success: true,
        message: 'Report submitted successfully.',
        data: populated,
      });
    }

    const id = `rep_${Date.now()}`;
    const newReport = {
      _id: id,
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl || '',
      latitude: numericLatitude,
      longitude: numericLongitude,
      status: 'pending',
      user: String(reportUser._id || reportUser.id || 'user_guest'),
      disaster: normalizedDisasterId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryReports.set(id, newReport);

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully.',
      data: newReport,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    for (const field of ['userId', 'user', '_id', 'createdAt', 'updatedAt']) {
      delete payload[field];
    }
    const canModerate = ['admin', 'coordinator', 'rescue_worker'].includes(req.user?.role);
    if (!canModerate) {
      delete payload.status;
      delete payload.disaster;
    } else {
      if (payload.status && !['pending', 'verified', 'rejected'].includes(payload.status)) {
        return res.status(400).json({ success: false, message: 'Invalid report status.' });
      }
      if (payload.disaster && !mongoose.Types.ObjectId.isValid(payload.disaster)) {
        return res.status(400).json({ success: false, message: 'Invalid disaster reference.' });
      }
    }

    if (mongoose.connection.readyState === 1) {
      const existing = await Report.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication is required to update a report.' });
      }

      if (!canModerate) {
        const isOwner = String(existing.user) === String(req.user._id);
        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message: 'You are not permitted to update this report.',
          });
        }
      }

      Object.assign(existing, payload);
      await existing.save();

      const updated = await Report.findById(existing._id)
        .populate('user', 'name email role organization')
        .populate('disaster', 'title type severity');

      return res.status(200).json({ success: true, data: updated });
    }

    const existing = inMemoryReports.get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    Object.assign(existing, payload, { updatedAt: new Date() });
    return res.status(200).json({ success: true, data: existing });
  } catch (error) {
    next(error);
  }
};

export const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const existing = await Report.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
      }

      if (!req.user || !['admin', 'coordinator', 'rescue_worker'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only coordinators or admins can remove incidents.',
        });
      }

      await existing.deleteOne();
      return res.status(200).json({ success: true, message: 'Report deleted successfully.' });
    }

    const existed = inMemoryReports.has(id);
    if (!existed) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    inMemoryReports.delete(id);
    return res.status(200).json({ success: true, message: 'Report deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
