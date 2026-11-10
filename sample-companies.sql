-- OPTIONAL: sample companies so the Browse screen isn't empty during sales demos.
-- Every name starts with "Sample". Remove them before homeowners use the app:
--   delete from companies where name like 'Sample %';
insert into companies (name, owner_name, category, service_areas, phone, about, level, status, years_on_list)
values
 ('Sample Plumbing Co', 'Pat Rivers', 'Plumbing', '{Hoover,Vestavia Hills}', '(205) 555-0101',
  'Repairs, water heaters, and repiping for older Birmingham homes.', 'respected', 'live', 3),
 ('Sample Electric', 'Sam Watts', 'Electrical', '{Homewood,Mountain Brook}', '(205) 555-0102',
  'Panel upgrades, lighting, and EV chargers. Licensed master electrician.', 'trusted', 'live', 1),
 ('Sample Heating & Air', 'Jordan Hale', 'HVAC', '{Trussville,Irondale}', '(205) 555-0103',
  'Tune-ups, new systems, and same-week repairs.', 'verified', 'live', 0),
 ('Sample Roofing', 'Casey Moss', 'Roofing', '{Pelham,Alabaster,Helena}', '(205) 555-0104',
  'Inspections, storm repair, and full replacements.', 'distinguished', 'live', 5);
