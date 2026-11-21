-- Seed: catalogue generated from src/data/services.ts and src/data/areas.ts

insert into public.service_categories (slug, name, summary, description, photo_alt, sort_order) values
  ('home-services-repairs', 'Home Services & Repairs', 'Plumbing, electrical, carpentry, painting', 'Reliable professionals for everyday home improvements, installations and repairs.', 'A tradesperson carrying out a repair in a home', 0),
  ('electronics-technology', 'Electronics & Technology', 'Phones, laptops, TVs, appliances', 'Get help with your electronics, devices and everyday technology.', 'A technician repairing an electronic device', 1),
  ('grooming-personal-care', 'Grooming & Personal Care', 'Barbers, hairstylists, makeup, nails', 'Find experienced professionals for your grooming and personal care needs.', 'A barber at work', 2),
  ('automotive-services', 'Automotive Services', 'Mechanics, auto electricians, tyres', 'Find skilled automotive professionals for vehicle repairs and maintenance.', 'A mechanic working on a vehicle', 3);

insert into public.services (category_id, slug, name, keywords, sort_order) values
  ((select id from public.service_categories where slug = 'home-services-repairs'), 'plumbing', 'Plumbing', array['plumber', 'pipes', 'leak', 'tap', 'water']::text[], 0),
  ((select id from public.service_categories where slug = 'home-services-repairs'), 'electrical-work', 'Electrical work', array['electrician', 'electrical', 'wiring', 'socket', 'light']::text[], 1),
  ((select id from public.service_categories where slug = 'home-services-repairs'), 'carpentry', 'Carpentry', array['carpenter', 'wood', 'cabinet', 'door', 'furniture']::text[], 2),
  ((select id from public.service_categories where slug = 'home-services-repairs'), 'painting', 'Painting', array['painter', 'paint', 'walls']::text[], 3),
  ((select id from public.service_categories where slug = 'home-services-repairs'), 'masonry', 'Masonry', array['mason', 'bricklayer', 'blocks', 'plaster']::text[], 4),
  ((select id from public.service_categories where slug = 'home-services-repairs'), 'tiling', 'Tiling', array['tiler', 'tiles', 'floor']::text[], 5),
  ((select id from public.service_categories where slug = 'home-services-repairs'), 'roofing', 'Roofing', array['roofer', 'roof', 'leaking roof']::text[], 6),
  ((select id from public.service_categories where slug = 'home-services-repairs'), 'general-home-repairs', 'General home repairs', array['handyman', 'fix', 'maintenance']::text[], 7),
  ((select id from public.service_categories where slug = 'home-services-repairs'), 'furniture-assembly', 'Furniture assembly', array['assemble', 'flat pack']::text[], 8),
  ((select id from public.service_categories where slug = 'electronics-technology'), 'mobile-phone-repairs', 'Mobile phone repairs', array['phone', 'mobile', 'screen', 'smartphone']::text[], 0),
  ((select id from public.service_categories where slug = 'electronics-technology'), 'laptop-repairs', 'Laptop repairs', array['laptop', 'notebook']::text[], 1),
  ((select id from public.service_categories where slug = 'electronics-technology'), 'computer-servicing', 'Computer servicing', array['computer', 'pc', 'desktop']::text[], 2),
  ((select id from public.service_categories where slug = 'electronics-technology'), 'television-repairs', 'Television repairs', array['tv', 'television']::text[], 3),
  ((select id from public.service_categories where slug = 'electronics-technology'), 'home-appliance-repairs', 'Home appliance repairs', array['appliance', 'fridge', 'washing machine', 'cooker', 'fan']::text[], 4),
  ((select id from public.service_categories where slug = 'electronics-technology'), 'software-installation', 'Software installation', array['software', 'install', 'windows']::text[], 5),
  ((select id from public.service_categories where slug = 'electronics-technology'), 'computer-troubleshooting', 'Computer troubleshooting', array['troubleshoot', 'virus', 'slow computer']::text[], 6),
  ((select id from public.service_categories where slug = 'electronics-technology'), 'electronics-maintenance', 'Electronics maintenance', array['electronics', 'servicing']::text[], 7),
  ((select id from public.service_categories where slug = 'grooming-personal-care'), 'barbers', 'Barbers', array['barber', 'haircut', 'shave', 'beard']::text[], 0),
  ((select id from public.service_categories where slug = 'grooming-personal-care'), 'hairstylists', 'Hairstylists', array['hairstylist', 'hair', 'hair styling', 'stylist', 'salon']::text[], 1),
  ((select id from public.service_categories where slug = 'grooming-personal-care'), 'makeup-artists', 'Makeup artists', array['makeup', 'make-up']::text[], 2),
  ((select id from public.service_categories where slug = 'grooming-personal-care'), 'nail-technicians', 'Nail technicians', array['nails', 'manicure', 'pedicure']::text[], 3),
  ((select id from public.service_categories where slug = 'grooming-personal-care'), 'braiding', 'Braiding', array['braids', 'plaits', 'cornrows']::text[], 4),
  ((select id from public.service_categories where slug = 'grooming-personal-care'), 'home-grooming', 'Home grooming', array['mobile barber', 'grooming at home']::text[], 5),
  ((select id from public.service_categories where slug = 'grooming-personal-care'), 'beauty-services', 'Beauty services', array['beauty', 'facial', 'skin']::text[], 6),
  ((select id from public.service_categories where slug = 'automotive-services'), 'general-mechanics', 'General mechanics', array['mechanic', 'car repair', 'car repairs', 'engine']::text[], 0),
  ((select id from public.service_categories where slug = 'automotive-services'), 'auto-electricians', 'Auto electricians', array['auto electrician', 'car electrician', 'car wiring']::text[], 1),
  ((select id from public.service_categories where slug = 'automotive-services'), 'vehicle-diagnostics', 'Vehicle diagnostics', array['diagnostic', 'diagnosis', 'check engine']::text[], 2),
  ((select id from public.service_categories where slug = 'automotive-services'), 'tyre-services', 'Tyre services', array['tyre', 'tire', 'wheel', 'puncture']::text[], 3),
  ((select id from public.service_categories where slug = 'automotive-services'), 'car-servicing', 'Car servicing', array['service', 'oil change']::text[], 4),
  ((select id from public.service_categories where slug = 'automotive-services'), 'battery-services', 'Battery services', array['battery', 'jump start']::text[], 5),
  ((select id from public.service_categories where slug = 'automotive-services'), 'vehicle-maintenance', 'Vehicle maintenance', array['maintenance', 'vehicle']::text[], 6);

insert into public.popular_services (service_id, label, sort_order) values
  ((select id from public.services where slug = 'plumbing'), 'Plumbing', 0),
  ((select id from public.services where slug = 'electrical-work'), 'Electrical repairs', 1),
  ((select id from public.services where slug = 'mobile-phone-repairs'), 'Phone repairs', 2),
  ((select id from public.services where slug = 'carpentry'), 'Carpentry', 3),
  ((select id from public.services where slug = 'hairstylists'), 'Hair styling', 4),
  ((select id from public.services where slug = 'general-mechanics'), 'Car repairs', 5),
  ((select id from public.services where slug = 'painting'), 'Painting', 6),
  ((select id from public.services where slug = 'home-appliance-repairs'), 'Appliance repairs', 7);

insert into public.areas (slug, name, sort_order) values
  ('ahodwo', 'Ahodwo', 0),
  ('asokwa', 'Asokwa', 1),
  ('adum', 'Adum', 2),
  ('bantama', 'Bantama', 3),
  ('knust-area', 'KNUST area', 4);
