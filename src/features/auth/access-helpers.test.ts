import { describe, expect, it } from "vitest";
import {
  checkCanManageMenu,
  checkCanManageMembers,
  checkCanViewMenu,
  checkIsSuperAdmin,
} from "./access-helpers";
import type { UserMembership } from "./user-access.functions";
import type { AppRole } from "@/features/restaurants/types";

const RESTAURANT_ID = "rest-123";

function roles(...roles: AppRole[]): AppRole[] {
  return roles;
}

function memberships(...items: UserMembership[]): UserMembership[] {
  return items;
}

describe("access helpers", () => {
  describe("checkIsSuperAdmin", () => {
    it("returns true when super_admin is present", () => {
      expect(checkIsSuperAdmin(roles("super_admin"))).toBe(true);
    });

    it("returns false for non-super_admin roles", () => {
      expect(checkIsSuperAdmin(roles("owner", "admin"))).toBe(false);
      expect(checkIsSuperAdmin(roles())).toBe(false);
    });
  });

  describe("checkCanManageMenu", () => {
    it("grants access to super_admin without membership", () => {
      expect(checkCanManageMenu(roles("super_admin"), memberships(), RESTAURANT_ID)).toBe(true);
    });

    it("grants access to owner", () => {
      expect(
        checkCanManageMenu(roles(), memberships({ restaurantId: RESTAURANT_ID, role: "owner" }), RESTAURANT_ID),
      ).toBe(true);
    });

    it("grants access to admin", () => {
      expect(
        checkCanManageMenu(roles(), memberships({ restaurantId: RESTAURANT_ID, role: "admin" }), RESTAURANT_ID),
      ).toBe(true);
    });

    it("denies access to staff", () => {
      expect(
        checkCanManageMenu(roles(), memberships({ restaurantId: RESTAURANT_ID, role: "staff" }), RESTAURANT_ID),
      ).toBe(false);
    });

    it("denies access when user belongs to a different restaurant", () => {
      expect(
        checkCanManageMenu(
          roles(),
          memberships({ restaurantId: "other-rest", role: "owner" }),
          RESTAURANT_ID,
        ),
      ).toBe(false);
    });
  });

  describe("checkCanManageMembers", () => {
    it("grants access to super_admin", () => {
      expect(checkCanManageMembers(roles("super_admin"), memberships(), RESTAURANT_ID)).toBe(true);
    });

    it("grants access to owner", () => {
      expect(
        checkCanManageMembers(roles(), memberships({ restaurantId: RESTAURANT_ID, role: "owner" }), RESTAURANT_ID),
      ).toBe(true);
    });

    it("denies access to admin", () => {
      expect(
        checkCanManageMembers(roles(), memberships({ restaurantId: RESTAURANT_ID, role: "admin" }), RESTAURANT_ID),
      ).toBe(false);
    });

    it("denies access to staff", () => {
      expect(
        checkCanManageMembers(roles(), memberships({ restaurantId: RESTAURANT_ID, role: "staff" }), RESTAURANT_ID),
      ).toBe(false);
    });
  });

  describe("checkCanViewMenu", () => {
    it("grants access to super_admin", () => {
      expect(checkCanViewMenu(roles("super_admin"), memberships(), RESTAURANT_ID)).toBe(true);
    });

    it("grants access to owner, admin and staff", () => {
      expect(checkCanViewMenu(roles(), memberships({ restaurantId: RESTAURANT_ID, role: "owner" }), RESTAURANT_ID)).toBe(true);
      expect(checkCanViewMenu(roles(), memberships({ restaurantId: RESTAURANT_ID, role: "admin" }), RESTAURANT_ID)).toBe(true);
      expect(checkCanViewMenu(roles(), memberships({ restaurantId: RESTAURANT_ID, role: "staff" }), RESTAURANT_ID)).toBe(true);
    });

    it("denies access without membership", () => {
      expect(checkCanViewMenu(roles(), memberships(), RESTAURANT_ID)).toBe(false);
    });
  });
});
