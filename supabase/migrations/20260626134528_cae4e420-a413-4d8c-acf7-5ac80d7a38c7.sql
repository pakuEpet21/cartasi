UPDATE public.feature_flags
SET flags = '{
  "chatbot": true,
  "cart": true,
  "minigame": false,
  "reservations": true,
  "loyaltyProgram": true,
  "menuFilters": true,
  "allergenInfo": true,
  "calorieInfo": true,
  "multiLanguage": true,
  "qrMenu": true,
  "tableOrdering": false,
  "deliveryTracking": false,
  "reviews": true,
  "gallery": true,
  "socialLinks": true,
  "whatsappOrder": true,
  "openingHours": true,
  "promotions": true,
  "staffPicker": true,
  "adminPanel": true,
  "productImages": true,
  "banner": true,
  "search": true
}'::jsonb,
updated_at = now()
WHERE restaurant_id = (SELECT id FROM public.restaurants WHERE slug='la-bella-tavola');