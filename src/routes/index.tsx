import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getMenu, getPromotions, getOpeningHours, getSocialLinks } from "@/features/menu";
import {
  MenuGrid, MenuSearch, CategoryTabs, AllergenFilter, useFilteredMenu,
} from "@/features/menu";
import { IfFlag, useFlag } from "@/features/flags";
import { SiteHeader } from "@/shared/components/site-header";
import { SiteFooter } from "@/shared/components/site-footer";
import { PromoBanner } from "@/shared/components/promo-banner";
import { Container } from "@/shared/components/container";
import { fadeUp } from "@/shared/motion";

const menuQuery = (restaurantId: string) =>
  queryOptions({
    queryKey: ["menu", restaurantId],
    queryFn: () => getMenu({ data: { restaurantId } }),
  });
const promosQuery = (restaurantId: string) =>
  queryOptions({
    queryKey: ["promotions", restaurantId],
    queryFn: () => getPromotions({ data: { restaurantId } }),
  });
const hoursQuery = (restaurantId: string) =>
  queryOptions({
    queryKey: ["hours", restaurantId],
    queryFn: () => getOpeningHours({ data: { restaurantId } }),
  });
const socialQuery = (restaurantId: string) =>
  queryOptions({
    queryKey: ["social", restaurantId],
    queryFn: () => getSocialLinks({ data: { restaurantId } }),
  });

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const root = context as { queryClient: import("@tanstack/react-query").QueryClient };
    // Read restaurant id from root loader data via window-free indirection:
    // we re-fetch here using the slug indirectly via the cached config.
    // Simpler: just trigger queries lazily client-side. Skip prefetch for now.
    return { qc: !!root.queryClient };
  },
  head: () => ({
    meta: [
      { title: "Carta — La Bella Tavola" },
      {
        name: "description",
        content:
          "Descubre nuestra carta de cocina italiana: entrantes, pastas, principales y postres con producto de temporada.",
      },
      { property: "og:title", content: "Carta — La Bella Tavola" },
      { property: "og:description", content: "Cocina italiana de autor en el corazón de la ciudad." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name: "La Bella Tavola",
          servesCuisine: "Italian",
          priceRange: "€€",
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  // Read root loader data
  const rootLoader = Route.useRouteContext();
  void rootLoader; // root loader data accessed via parent

  // Restaurant config lives in the root match — read via route match API
  const parent = Route.useMatch({ select: (m) => m });
  void parent;

  // Easier: use a separate hook via supabase getRestaurantConfig isn't necessary —
  // the root loader already cached it. We pull it from window via __TSR_LOADER_DATA__?
  // Simpler/cleaner: re-call getRestaurantConfig as a query keyed by slug.
  return <HomeContent />;
}

import { getRestaurantConfig } from "@/features/flags";
import { ACTIVE_RESTAURANT_SLUG, SITE_NAME } from "@/shared/config";

function HomeContent() {
  const cfg = useSuspenseQuery({
    queryKey: ["restaurant-config", ACTIVE_RESTAURANT_SLUG],
    queryFn: () => getRestaurantConfig({ data: { slug: ACTIVE_RESTAURANT_SLUG } }),
  });

  const restaurant = cfg.data.restaurant;
  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Restaurante no encontrado.</p>
      </div>
    );
  }

  return <HomeReady restaurantId={restaurant.id} currency={restaurant.currency} restaurant={restaurant} />;
}

function HomeReady({
  restaurantId,
  currency,
  restaurant,
}: {
  restaurantId: string;
  currency: string;
  restaurant: NonNullable<Awaited<ReturnType<typeof getRestaurantConfig>>["restaurant"]>;
}) {
  const menu = useSuspenseQuery(menuQuery(restaurantId));
  const promos = useSuspenseQuery(promosQuery(restaurantId));
  const hours = useSuspenseQuery(hoursQuery(restaurantId));
  const social = useSuspenseQuery(socialQuery(restaurantId));
  const showFilters = useFlag("menuFilters");
  const showSearch = useFlag("search");

  const filtered = useFilteredMenu(menu.data.items);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader siteName={restaurant.name} />
      <main>
        <Container className="py-10 sm:py-14">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-primary">
              {restaurant.tagline ?? "Carta"}
            </p>
            <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
              {restaurant.name}
            </h1>
            {restaurant.description && (
              <p className="mt-3 text-muted-foreground sm:text-lg">{restaurant.description}</p>
            )}
          </motion.div>

          <IfFlag name="banner">
            {promos.data.length > 0 && (
              <div className="mt-8">
                <PromoBanner promotion={promos.data[0]} />
              </div>
            )}
          </IfFlag>

          <div className="mt-10 space-y-4">
            {showSearch && (
              <div className="max-w-md">
                <MenuSearch />
              </div>
            )}
            {showFilters && (
              <>
                <CategoryTabs categories={menu.data.categories} />
                <IfFlag name="allergenInfo">
                  <AllergenFilter />
                </IfFlag>
              </>
            )}
          </div>

          <div className="mt-8">
            <MenuGrid items={filtered} currency={currency} />
          </div>
        </Container>
      </main>
      <SiteFooter
        siteName={restaurant.name}
        address={restaurant.address}
        phone={restaurant.phone}
        email={restaurant.email}
        openingHours={hours.data}
        socialLinks={social.data}
      />
    </div>
  );
}