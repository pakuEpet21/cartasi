import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  getMenu, getPromotions, getOpeningHours, getSocialLinks,
  MenuGrid, MenuSearch, CategoryTabs, AllergenFilter, useFilteredMenu,
} from "@/features/menu";
import { IfFlag, useFlag, getRestaurantConfig } from "@/features/flags";
import { SiteHeader } from "@/shared/components/site-header";
import { SiteFooter } from "@/shared/components/site-footer";
import { PromoBanner } from "@/shared/components/promo-banner";
import { Container } from "@/shared/components/container";
import { fadeUp } from "@/shared/motion";
import { ACTIVE_RESTAURANT_SLUG } from "@/shared/config";

const configQuery = () =>
  queryOptions({
    queryKey: ["restaurant-config", ACTIVE_RESTAURANT_SLUG],
    queryFn: () => getRestaurantConfig({ data: { slug: ACTIVE_RESTAURANT_SLUG } }),
  });
const menuQuery = (id: string) =>
  queryOptions({ queryKey: ["menu", id], queryFn: () => getMenu({ data: { restaurantId: id } }) });
const promosQuery = (id: string) =>
  queryOptions({ queryKey: ["promotions", id], queryFn: () => getPromotions({ data: { restaurantId: id } }) });
const hoursQuery = (id: string) =>
  queryOptions({ queryKey: ["hours", id], queryFn: () => getOpeningHours({ data: { restaurantId: id } }) });
const socialQuery = (id: string) =>
  queryOptions({ queryKey: ["social", id], queryFn: () => getSocialLinks({ data: { restaurantId: id } }) });

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(configQuery());
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
  const cfg = useSuspenseQuery(configQuery());
  const restaurant = cfg.data.restaurant;
  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Restaurante no encontrado.</p>
      </div>
    );
  }
  return <HomeReady restaurant={restaurant} />;
}

type Restaurant = NonNullable<Awaited<ReturnType<typeof getRestaurantConfig>>["restaurant"]>;

function HomeReady({ restaurant }: { restaurant: Restaurant }) {
  const menu = useSuspenseQuery(menuQuery(restaurant.id));
  const promos = useSuspenseQuery(promosQuery(restaurant.id));
  const hours = useSuspenseQuery(hoursQuery(restaurant.id));
  const social = useSuspenseQuery(socialQuery(restaurant.id));
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
            <MenuGrid items={filtered} currency={restaurant.currency} />
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