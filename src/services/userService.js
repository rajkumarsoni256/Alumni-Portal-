/**
 * User and Network Service Layer
 * 
 * Provides an abstraction for discovering JECRC students and alumni,
 * filtering/searching directories, managing connections, and handling requests.
 * 
 * Ready for future backend API integration (e.g. GET /api/users?page=1&limit=20).
 */

import { MOCK_USERS, MOCK_CONNECTION_REQUESTS } from '../data/mockData';

// In-memory mutable collections for client mock simulation
let memoryUsers = { ...MOCK_USERS };
let memoryRequests = [...MOCK_CONNECTION_REQUESTS];

export const userService = {
  /**
   * Fetch paginated and filtered users
   * @param {Object} params
   * @param {number} [params.page=1]
   * @param {number} [params.limit=24]
   * @param {string} [params.type='all'] - 'all' | 'alumni' | 'student'
   * @param {string} [params.branch='all']
   * @param {string|number} [params.batch='all']
   * @param {string} [params.location='all']
   * @param {string} [params.query='']
   * @returns {Promise<{ users: Array, totalCount: number, page: number, totalPages: number, hasMore: boolean }>}
   */
  getUsers: async ({
    page = 1,
    limit = 24,
    type = 'all',
    branch = 'all',
    batch = 'all',
    location = 'all',
    query = '',
  } = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allList = Object.values(memoryUsers);

        const filtered = allList.filter((user) => {
          // Exclude self if needed, or include all members
          
          // 1. Role Type Filter
          if (type === 'alumni' && !user.isAlumni) return false;
          if (type === 'student' && user.isAlumni) return false;

          // 2. Branch Filter
          if (branch !== 'all' && user.branch !== branch) {
            // Check substring or normalization
            if (!user.branch?.toLowerCase().includes(branch.toLowerCase())) return false;
          }

          // 3. Batch Filter
          if (batch !== 'all') {
            const batchNum = Number(batch);
            if (Number(user.batch) !== batchNum && !String(user.batch).includes(String(batch))) {
              return false;
            }
          }

          // 4. Location Filter
          if (location !== 'all') {
            if (!user.location?.toLowerCase().includes(location.toLowerCase())) {
              return false;
            }
          }

          // 5. Search Query Filter (Case-insensitive across Name, Company, Role/Headline, Skills, Branch, Location)
          if (query && query.trim()) {
            const q = query.toLowerCase().trim();
            const matchesName = user.name?.toLowerCase().includes(q);
            const matchesHeadline = user.headline?.toLowerCase().includes(q);
            const matchesRole = user.role?.toLowerCase().includes(q) || user.currentRole?.toLowerCase().includes(q);
            const matchesCompany = user.company?.toLowerCase().includes(q);
            const matchesBranch = user.branch?.toLowerCase().includes(q);
            const matchesLocation = user.location?.toLowerCase().includes(q);
            const matchesSkills = user.skills?.some((s) => s.toLowerCase().includes(q));

            if (!matchesName && !matchesHeadline && !matchesRole && !matchesCompany && !matchesBranch && !matchesLocation && !matchesSkills) {
              return false;
            }
          }

          return true;
        });

        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / limit) || 1;
        const startIndex = (page - 1) * limit;
        const pagedUsers = filtered.slice(0, startIndex + limit); // cumulative for "Load More" or slice for page

        resolve({
          users: pagedUsers,
          totalCount,
          page,
          totalPages,
          hasMore: startIndex + limit < totalCount,
        });
      }, 60);
    });
  },

  /**
   * Get single user by ID
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  getUserById: async (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(memoryUsers[userId] || null);
      }, 40);
    });
  },

  /**
   * Fetch incoming connection requests
   * @returns {Promise<Array>}
   */
  getConnectionRequests: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...memoryRequests]);
      }, 50);
    });
  },

  /**
   * Accept incoming connection request
   * @param {string} requestId
   * @param {string} fromUserId
   * @returns {Promise<boolean>}
   */
  acceptConnectionRequest: async (requestId, fromUserId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        memoryRequests = memoryRequests.filter((r) => r.id !== requestId);
        if (memoryUsers[fromUserId]) {
          memoryUsers[fromUserId] = {
            ...memoryUsers[fromUserId],
            connectionStatus: 'connected',
            connectionsCount: (memoryUsers[fromUserId].connectionsCount || 0) + 1,
          };
        }
        resolve(true);
      }, 50);
    });
  },

  /**
   * Ignore incoming connection request
   * @param {string} requestId
   * @returns {Promise<boolean>}
   */
  ignoreConnectionRequest: async (requestId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        memoryRequests = memoryRequests.filter((r) => r.id !== requestId);
        resolve(true);
      }, 50);
    });
  },

  /**
   * Toggle connection request state (none <-> pending)
   * @param {string} userId
   * @returns {Promise<string>} 'pending' | 'none'
   */
  toggleConnect: async (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = memoryUsers[userId];
        if (!user) return resolve('none');

        const nextStatus = user.connectionStatus === 'pending' ? 'none' : 'pending';
        memoryUsers[userId] = {
          ...user,
          connectionStatus: nextStatus,
        };
        resolve(nextStatus);
      }, 50);
    });
  },
};
