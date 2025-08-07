// Unit Tests for Controllers
const AuthController = require('../../controllers/authController');
const ShiftsController = require('../../controllers/shiftsController');
const ChatController = require('../../controllers/chatController');
const SubscriptionController = require('../../controllers/subscriptionController');

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      admin: {
        deleteUser: jest.fn()
      }
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      upsert: jest.fn().mockReturnThis()
    }))
  }))
}));

// Mock SSAB System
jest.mock('../../ssab-system', () => ({
  getTeamSchedule: jest.fn()
}));

describe('Controllers Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 'test-user-id', email: 'test@ssab.com' },
      params: {},
      query: {},
      body: {},
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
  });

  describe('AuthController', () => {
    describe('verifyToken', () => {
      test('should verify valid token', async () => {
        req.headers.authorization = 'Bearer valid-token';
        
        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-id', email: 'test@ssab.com' } },
          error: null
        });

        await AuthController.verifyToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
      });

      test('should reject missing token', async () => {
        await AuthController.verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'No token provided',
          code: 'UNAUTHORIZED'
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('should reject invalid token', async () => {
        req.headers.authorization = 'Bearer invalid-token';
        
        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' }
        });

        await AuthController.verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Invalid token',
          code: 'UNAUTHORIZED'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('getCurrentUser', () => {
      test('should return user profile', async () => {
        const mockProfile = {
          id: 'user-id',
          full_name: 'Test User',
          selected_team: 31,
          subscriptions: [{ plan: 'basic' }],
          user_preferences: [{ theme: 'light' }]
        };

        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: mockProfile,
          error: null
        });

        await AuthController.getCurrentUser(req, res);

        expect(res.json).toHaveBeenCalledWith({
          user: req.user,
          profile: mockProfile,
          subscription: mockProfile.subscriptions[0],
          preferences: mockProfile.user_preferences[0]
        });
      });

      test('should handle profile not found', async () => {
        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        });

        await AuthController.getCurrentUser(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      });
    });

    describe('updateProfile', () => {
      test('should update profile successfully', async () => {
        req.body = {
          full_name: 'Updated Name',
          selected_team: 32
        };

        const mockUpdatedProfile = {
          id: 'user-id',
          full_name: 'Updated Name',
          selected_team: 32
        };

        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.from().update().eq().select().single.mockResolvedValue({
          data: mockUpdatedProfile,
          error: null
        });

        await AuthController.updateProfile(req, res);

        expect(res.json).toHaveBeenCalledWith({
          message: 'Profile updated successfully',
          profile: mockUpdatedProfile
        });
      });

      test('should handle update errors', async () => {
        req.body = { full_name: 'Test' };

        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.from().update().eq().select().single.mockResolvedValue({
          data: null,
          error: { message: 'Update failed' }
        });

        await AuthController.updateProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Failed to update profile',
          code: 'UPDATE_FAILED',
          details: 'Update failed'
        });
      });
    });
  });

  describe('ShiftsController', () => {
    const SSABSystem = require('../../ssab-system');

    describe('getTeamShifts', () => {
      test('should return team shifts', async () => {
        req.params.team = '31';
        req.query = { startDate: '2024-01-01', endDate: '2024-01-07' };

        const mockShifts = [
          { date: '2024-01-01', type: 'F', shift_name: 'Förmiddag' },
          { date: '2024-01-02', type: 'F', shift_name: 'Förmiddag' }
        ];

        SSABSystem.getTeamSchedule.mockReturnValue(mockShifts);

        // Mock profile check
        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { selected_team: 31, company_type: 'ssab' },
          error: null
        });

        await ShiftsController.getTeamShifts(req, res);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            team: 31,
            shifts: mockShifts,
            statistics: expect.any(Object)
          })
        );
      });

      test('should validate team number', async () => {
        req.params.team = '30'; // Invalid team

        await ShiftsController.getTeamShifts(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Invalid team number. Must be between 31-35',
          code: 'INVALID_TEAM'
        });
      });

      test('should validate date format', async () => {
        req.params.team = '31';
        req.query = { startDate: 'invalid-date' };

        await ShiftsController.getTeamShifts(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Invalid date format. Use YYYY-MM-DD',
          code: 'INVALID_DATE'
        });
      });

      test('should handle premium access control', async () => {
        req.params.team = '32'; // Different team
        
        // Mock user profile with different team
        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.from().select().eq().single
          .mockResolvedValueOnce({
            data: { selected_team: 31, company_type: 'ssab' },
            error: null
          })
          .mockResolvedValueOnce({
            data: null, // No subscription found
            error: { code: 'PGRST116' }
          });

        await ShiftsController.getTeamShifts(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Access denied. Upgrade to view other teams',
          code: 'PREMIUM_REQUIRED'
        });
      });
    });

    describe('getDayShifts', () => {
      test('should return all teams for a day', async () => {
        req.params.date = '2024-01-01';

        const mockShifts = [
          { date: '2024-01-01', type: 'F', shift_name: 'Förmiddag' }
        ];

        SSABSystem.getTeamSchedule.mockReturnValue(mockShifts);

        await ShiftsController.getDayShifts(req, res);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            date: '2024-01-01',
            shifts: expect.any(Array),
            validation: expect.any(Object)
          })
        );
      });

      test('should validate date format', async () => {
        req.params.date = 'invalid-date';

        await ShiftsController.getDayShifts(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Invalid date format. Use YYYY-MM-DD',
          code: 'INVALID_DATE'
        });
      });
    });

    describe('exportCSV', () => {
      test('should export shifts as CSV', async () => {
        req.params.team = '31';
        req.query = { format: 'csv' };

        const mockShifts = [
          {
            date: '2024-01-01',
            type: 'F',
            shift_name: 'Förmiddag',
            start_time: '06:00',
            end_time: '14:00',
            pattern_name: '3F→2E→2N→5L'
          }
        ];

        SSABSystem.getTeamSchedule.mockReturnValue(mockShifts);

        await ShiftsController.exportCSV(req, res);

        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
        expect(res.setHeader).toHaveBeenCalledWith(
          'Content-Disposition',
          expect.stringContaining('attachment; filename=')
        );
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Date,Weekday'));
      });

      test('should return JSON when format is not CSV', async () => {
        req.params.team = '31';
        req.query = { format: 'json' };

        const mockShifts = [{ date: '2024-01-01', type: 'F' }];
        SSABSystem.getTeamSchedule.mockReturnValue(mockShifts);

        await ShiftsController.exportCSV(req, res);

        expect(res.json).toHaveBeenCalledWith({ shifts: mockShifts });
      });
    });
  });

  describe('ChatController', () => {
    describe('getChatRooms', () => {
      test('should return accessible chat rooms', async () => {
        const mockRooms = [
          {
            id: 'room-1',
            name: 'General',
            is_public: true,
            chat_messages: []
          }
        ];

        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { selected_team: 31, company_type: 'ssab' },
          error: null
        });

        mockSupabase.from().select().or().order.mockResolvedValue({
          data: mockRooms,
          error: null
        });

        await ChatController.getChatRooms(req, res);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            rooms: expect.any(Array),
            user_team: 31
          })
        );
      });
    });

    describe('sendMessage', () => {
      test('should send message successfully', async () => {
        req.params.roomId = 'room-1';
        req.body = { content: 'Test message' };

        const mockRoom = {
          id: 'room-1',
          is_team_specific: false,
          is_public: true
        };

        const mockMessage = {
          id: 'message-1',
          content: 'Test message',
          user_id: 'test-user-id',
          profiles: { full_name: 'Test User' }
        };

        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.from().select().eq().single
          .mockResolvedValueOnce({ data: mockRoom, error: null })
          .mockResolvedValueOnce({ data: mockMessage, error: null });

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: mockMessage,
          error: null
        });

        mockSupabase.from().update().eq.mockResolvedValue({
          data: null,
          error: null
        });

        await ChatController.sendMessage(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Message sent successfully',
          data: mockMessage
        });
      });

      test('should validate message content', async () => {
        req.params.roomId = 'room-1';
        req.body = { content: '' };

        await ChatController.sendMessage(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Message content is required',
          code: 'INVALID_INPUT'
        });
      });

      test('should validate message length', async () => {
        req.params.roomId = 'room-1';
        req.body = { content: 'x'.repeat(1001) }; // Too long

        await ChatController.sendMessage(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Message too long (max 1000 characters)',
          code: 'MESSAGE_TOO_LONG'
        });
      });
    });
  });

  describe('SubscriptionController', () => {
    describe('getSubscription', () => {
      test('should return existing subscription', async () => {
        const mockSubscription = {
          user_id: 'test-user-id',
          plan: 'basic',
          status: 'active'
        };

        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: mockSubscription,
          error: null
        });

        await SubscriptionController.getSubscription(req, res);

        expect(res.json).toHaveBeenCalledWith({
          subscription: mockSubscription,
          features: expect.any(Array)
        });
      });

      test('should create free subscription if none exists', async () => {
        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        });

        const mockNewSubscription = {
          user_id: 'test-user-id',
          plan: 'free',
          status: 'active'
        };

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: mockNewSubscription,
          error: null
        });

        await SubscriptionController.getSubscription(req, res);

        expect(res.json).toHaveBeenCalledWith({
          subscription: mockNewSubscription,
          features: expect.any(Array)
        });
      });
    });

    describe('createCheckoutSession', () => {
      test('should create checkout session for valid plan', async () => {
        req.body = {
          plan: 'basic',
          success_url: 'https://app.com/success',
          cancel_url: 'https://app.com/cancel'
        };

        const mockSupabase = require('@supabase/supabase-js').createClient();
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { plan: 'free' },
          error: null
        });

        mockSupabase.from().upsert.mockResolvedValue({
          data: null,
          error: null
        });

        await SubscriptionController.createCheckoutSession(req, res);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            checkout_url: expect.any(String),
            session_id: expect.any(String),
            plan: 'basic',
            amount: 3900,
            currency: 'SEK'
          })
        );
      });

      test('should reject invalid plan', async () => {
        req.body = { plan: 'invalid' };

        await SubscriptionController.createCheckoutSession(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Invalid plan. Must be basic or premium',
          code: 'INVALID_PLAN'
        });
      });
    });

    describe('getPlans', () => {
      test('should return all subscription plans', async () => {
        await SubscriptionController.getPlans(req, res);

        expect(res.json).toHaveBeenCalledWith({
          plans: expect.objectContaining({
            free: expect.any(Object),
            basic: expect.any(Object),
            premium: expect.any(Object)
          })
        });
      });
    });
  });
});