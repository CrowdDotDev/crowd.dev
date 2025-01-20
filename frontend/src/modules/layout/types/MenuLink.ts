interface MenuLinkParams {
  user: any,
}

export interface MenuLink {
  id: string;
  label: string;
  icon?: string;
  routeName?: string;
  routeOptions?: any;
  href?: string;
  click?: () => void;
  display: (params: MenuLinkParams) => boolean;
}
