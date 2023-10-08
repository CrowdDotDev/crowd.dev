drop trigger if exists "customViewOrders_update_order" on "customViewOrders";

drop function if exists "customViewOrders_update_order"();

drop table "customViewOrders";
drop table "customViews";

drop type "customViewVisibility";