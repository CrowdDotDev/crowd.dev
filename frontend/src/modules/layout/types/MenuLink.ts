interface MenuLinkParams {
  user: any,
  tenant: any,
}

export interface MenuLink {
  id: string;
  label: string;
  icon: string;
  routeName: string;
  display: (params: MenuLinkParams) => boolean;
  disable: (params: MenuLinkParams) => boolean;
}
