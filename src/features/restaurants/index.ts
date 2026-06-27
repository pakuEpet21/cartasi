/**
 * Super Admin Restaurant Management — Feature Public Exports
 * PR 3: Admin UI
 */

// Server functions (admin)
export {
  createRestaurant,
  listRestaurants,
  getRestaurantDetails,
  assignOwner,
  assignStaff,
  toggleRestaurantStatus,
  listInvitations,
  getInvitationByToken,
  checkSuperAdminRole,
} from "./admin.functions";

// Hook
export { useSuperAdmin } from "./hooks/use-super-admin";

// Types
export type {
  CreateRestaurantInput,
  InviteOwnerInput,
  InviteStaffInput,
  InvitationCreated,
  PaginatedRestaurants,
  RestaurantInvitation,
  SuperAdminMember,
  SuperAdminRestaurantDetails,
  ToggleStatusResult,
} from "./types";

// Components
export { RestaurantList } from "./components/restaurant-list";
export { RestaurantDetail } from "./components/restaurant-detail";
export { CreateRestaurantForm } from "./components/create-restaurant-form";
export { InviteForm } from "./components/invite-form";
export { ToggleStatusButton } from "./components/toggle-status-button";
