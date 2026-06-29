import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  getMenu, getPromotions,
  MenuGrid, MenuSearch, CategoryTabs, AllergenFilter, useFilteredMenu,
} from "@/features/menu";
import { IfFlag, useFlag, getRestaurantConfig } from "@/features/flags";
import { SiteHeader } from "@/shared/components/site-header";
import { SiteFooter } from "@/shared/components/site-footer";
import { PromoBanner } from "@/shared/components/promo-banner";
import { PromoStrip } from "@/shared/components/promo-strip";
import { Container } from "@/shared/components/container";
import { fadeUp } from "@/shared/motion";
import { ACTIVE_RESTAURANT_SLUG, SITE_NAME } from "@/shared/config";
import { STATIC_OPENING_HOURS, STATIC_SOCIAL_LINKS } from "@/shared/config/restaurant-static";
import { CartDrawer } from "@/features/cart";
import { ReservationForm } from "@/features/reservations";
import { ReviewsSection } from "@/features/reviews";
import { GallerySection } from "@/features/gallery";
import { LoyaltyCard } from "@/features/loyalty";
import { ChatbotWidget } from "@/features/chatbot";

const configQuery = () =>
  queryOptions({
    queryKey: ["restaurant-config", ACTIVE_RESTAURANT_SLUG],
    queryFn: () => getRestaurantConfig({ data: { slug: ACTIVE_RESTAURANT_SLUG } }),
  });
const menuQuery = (id: string) =>
  queryOptions({ queryKey: ["menu", id], queryFn: () => getMenu({ data: { restaurantId: id } }) });
const promosQuery = (id: string) =>
  queryOptions({ queryKey: ["promotions", id], queryFn: () => getPromotions({ data: { restaurantId: id } }) });

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    console.log("[loader] ACTIVE_RESTAURANT_SLUG:", ACTIVE_RESTAURANT_SLUG);
    const cfg = await getRestaurantConfig({ data: { slug: ACTIVE_RESTAURANT_SLUG } });
    console.log("[loader] config:", cfg);
    // Ensure the query cache has the same data the server just rendered,
    // otherwise the client may hydrate with stale cached data and mismatch.
    context.queryClient.setQueryData(configQuery().queryKey, cfg);
    return cfg;
  },
  head: ({ loaderData }) => {
    const name = loaderData.restaurant?.name ?? SITE_NAME;
    return {
      meta: [
        { title: `${name} — Carta` },
        {
          name: "description",
          content: `Descubre la carta de ${name}.`,
        },
        { property: "og:title", content: `${name} — Carta` },
        { property: "og:description", content: `Carta digital de ${name}.` },
        { property: "og:url", content: "/" },
      ],
      links: [{ rel: "canonical", href: "/" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            name,
          }),
        },
      ],
    };
  },
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

          <IfFlag name="promotions">
            {promos.data.length > 1 && (
              <div className="mt-16">
                <h2 className="font-display text-2xl sm:text-3xl">Promociones</h2>
                <div className="mt-4">
                  <PromoStrip promotions={promos.data.slice(1)} />
                </div>
              </div>
            )}
          </IfFlag>

          <IfFlag name="gallery">
            <div className="mt-16">
              <GallerySection items={menu.data.items} />
            </div>
          </IfFlag>

          <IfFlag name="loyaltyProgram">
            <div className="mt-16">
              <LoyaltyCard slug={restaurant.slug} />
            </div>
          </IfFlag>

          <IfFlag name="reservations">
            <div className="mt-16">
              <ReservationForm restaurantId={restaurant.id} />
            </div>
          </IfFlag>

          <IfFlag name="reviews">
            <div className="mt-16">
              <ReviewsSection restaurantId={restaurant.id} />
            </div>
          </IfFlag>
        </Container>
      </main>
      <SiteFooter
        siteName={restaurant.name}
        address={restaurant.address}
        phone={restaurant.phone}
        email={restaurant.email}
        openingHours={STATIC_OPENING_HOURS}
        socialLinks={STATIC_SOCIAL_LINKS}
      />
      <IfFlag name="cart">
        <CartDrawer
          currency={restaurant.currency}
          phone={restaurant.phone}
          restaurantName={restaurant.name}
        />
      </IfFlag>
      <IfFlag name="chatbot">
        <ChatbotWidget
          restaurantName={restaurant.name}
          address={restaurant.address}
          phone={restaurant.phone}
          email={restaurant.email}
        />
      </IfFlag>
    </div>
  );
}