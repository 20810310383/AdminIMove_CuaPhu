import React from 'react';
import * as L from 'lucide-react';

// Semantic navigation, status and dashboard illustrations use the PNG
// asset system shared with User, Driver and Merchant. Tiny interaction
// controls continue to use Lucide for crisp directional and edit affordances.
const PNG_MAP = {
  "LayoutDashboard": "ic_all.png",
  "House": "ic_home.png",
  "Home": "ic_home.png",
  "Activity": "ic_explore.png",
  "TrendingUp": "ic_explore.png",
  "Route": "ic_orders.png",
  "Navigation": "ic_pickup_location.png",
  "MapPin": "ic_saved_addresses.png",
  "MapPinned": "ic_driver_demand_map.png",
  "Crosshair": "ic_pickup_location.png",
  "Car": "ic_service_car.png",
  "Bike": "ic_service_motorbike.png",
  "Truck": "ic_service_delivery.png",
  "Package": "ic_service_delivery.png",
  "PackageCheck": "ic_orders.png",
  "Users": "ic_account.png",
  "UsersRound": "ic_account.png",
  "UserRound": "ic_account.png",
  "UserRoundCheck": "ic_driver_kyc.png",
  "UserCheck": "ic_driver_kyc.png",
  "WalletCards": "ic_payment_methods.png",
  "Wallet": "ic_payment_methods.png",
  "CircleDollarSign": "ic_points.png",
  "BadgeDollarSign": "ic_driver_points.png",
  "Banknote": "ic_driver_earnings.png",
  "CreditCard": "ic_payment_methods.png",
  "Landmark": "ic_driver_earnings.png",
  "DollarSign": "ic_driver_earnings.png",
  "Receipt": "ic_orders.png",
  "ChartNoAxesCombined": "ic_explore.png",
  "BarChart3": "ic_explore.png",
  "ChartColumn": "ic_explore.png",
  "PieChart": "ic_explore.png",
  "Settings": "ic_settings.png",
  "SlidersHorizontal": "ic_settings.png",
  "Cog": "ic_settings.png",
  "Server": "ic_settings.png",
  "Bell": "ic_notifications.png",
  "BellRing": "ic_notifications.png",
  "Megaphone": "ic_notifications.png",
  "RadioTower": "ic_driver_demand_map.png",
  "Store": "ic_merchant_profile.png",
  "ShoppingBag": "ic_shopping.png",
  "ShoppingCart": "ic_shopping.png",
  "UtensilsCrossed": "ic_merchant_default_food.png",
  "ChefHat": "ic_merchant_default_food.png",
  "Award": "ic_driver_rewards.png",
  "Star": "ic_top_rated.png",
  "Flame": "ic_driver_rewards_tasks.png",
  "ShieldCheck": "ic_safety_security.png",
  "ShieldAlert": "ic_driver_anti_fraud_trust.png",
  "Shield": "ic_safety_security.png",
  "ShieldX": "ic_driver_anti_fraud_trust.png",
  "Fingerprint": "ic_driver_face_liveness.png",
  "ScanFace": "ic_driver_face_liveness.png",
  "FileText": "ic_terms.png",
  "ClipboardCheck": "ic_orders.png",
  "ClipboardList": "ic_orders.png",
  "History": "ic_driver_completed_trips.png",
  "CalendarDays": "ic_orders.png",
  "MessageCircle": "ic_messages.png",
  "MessageSquareText": "ic_messages.png",
  "Headphones": "ic_support_center.png",
  "LifeBuoy": "ic_support_center.png",
  "Smartphone": "ic_account.png",
  "MonitorSmartphone": "ic_account.png",
  "Database": "ic_settings.png",
  "BadgePercent": "ic_promotions.png",
  "Percent": "ic_promotions.png",
  "Gift": "ic_driver_rewards.png",
  "ImagePlus": "ic_featured.png",
  "Images": "ic_featured.png",
  "Image": "ic_featured.png",
  "QrCode": "ic_payment_methods.png",
  "Target": "ic_driver_rewards_tasks.png",
  "Radar": "ic_driver_demand_map.png",
  "LogOut": "ic_logout.png",
  "LockKeyhole": "ic_safety_security.png",
  "ShieldQuestion": "ic_safety_security.png",
  "CircleHelp": "ic_support_center.png",
  "Phone": "ic_support_center.png",
  "Eye": "ic_search.png",
  "Search": "ic_search.png",
  "RefreshCw": "ic_refresh.png",
  "RotateCcw": "ic_refresh.png"
};

function glyph(name) {
  const Original = L[name];
  return React.forwardRef(function AdminGlyph({size=20, color, strokeWidth, className='', style, ...props}, ref) {
    const filename = PNG_MAP[name];
    const pixelSize = typeof size === 'number' ? size : parseFloat(size) || 20;
    if (filename && pixelSize >= 18) {
      // Only drop SVG-only attributes; maintain aria labels and click handlers.
      return <img
        ref={ref}
        src={`/icons/${filename}`}
        width={size}
        height={size}
        alt=""
        aria-hidden="true"
        decoding="async"
        className={`admin-png-icon ${className}`.trim()}
        style={{objectFit:'contain',flexShrink:0,verticalAlign:'middle',...(style||{})}}
        {...props}
      />;
    }
    return Original ? <Original ref={ref} size={size} color={color} strokeWidth={strokeWidth} className={className} style={style} {...props}/> : null;
  });
}
export const Activity = glyph("Activity");
export const AlertCircle = glyph("AlertCircle");
export const AlertTriangle = glyph("AlertTriangle");
export const AlignCenter = glyph("AlignCenter");
export const AlignLeft = glyph("AlignLeft");
export const AlignRight = glyph("AlignRight");
export const ArrowUpRight = glyph("ArrowUpRight");
export const Award = glyph("Award");
export const BadgeCheck = glyph("BadgeCheck");
export const BadgeDollarSign = glyph("BadgeDollarSign");
export const Ban = glyph("Ban");
export const Banknote = glyph("Banknote");
export const BarChart3 = glyph("BarChart3");
export const BellRing = glyph("BellRing");
export const Bike = glyph("Bike");
export const Bold = glyph("Bold");
export const BusFront = glyph("BusFront");
export const Cable = glyph("Cable");
export const CalendarDays = glyph("CalendarDays");
export const Car = glyph("Car");
export const CarFront = glyph("CarFront");
export const ChartNoAxesCombined = glyph("ChartNoAxesCombined");
export const Check = glyph("Check");
export const CheckCircle2 = glyph("CheckCircle2");
export const ChevronDown = glyph("ChevronDown");
export const ChevronLeft = glyph("ChevronLeft");
export const ChevronRight = glyph("ChevronRight");
export const CircleDollarSign = glyph("CircleDollarSign");
export const CircleHelp = glyph("CircleHelp");
export const CircleUserRound = glyph("CircleUserRound");
export const Clock3 = glyph("Clock3");
export const Copy = glyph("Copy");
export const Crosshair = glyph("Crosshair");
export const Database = glyph("Database");
export const Download = glyph("Download");
export const ExternalLink = glyph("ExternalLink");
export const Eye = glyph("Eye");
export const EyeOff = glyph("EyeOff");
export const FileCheck2 = glyph("FileCheck2");
export const FileText = glyph("FileText");
export const Filter = glyph("Filter");
export const Fingerprint = glyph("Fingerprint");
export const Flame = glyph("Flame");
export const Gauge = glyph("Gauge");
export const Globe2 = glyph("Globe2");
export const Heading2 = glyph("Heading2");
export const Heading3 = glyph("Heading3");
export const Headphones = glyph("Headphones");
export const History = glyph("History");
export const IdCard = glyph("IdCard");
export const Image = glyph("Image");
export const Images = glyph("Images");
export const Inbox = glyph("Inbox");
export const Italic = glyph("Italic");
export const KeyRound = glyph("KeyRound");
export const Landmark = glyph("Landmark");
export const LayoutDashboard = glyph("LayoutDashboard");
export const Link2 = glyph("Link2");
export const List = glyph("List");
export const ListOrdered = glyph("ListOrdered");
export const LoaderCircle = glyph("LoaderCircle");
export const LockKeyhole = glyph("LockKeyhole");
export const LogOut = glyph("LogOut");
export const Mail = glyph("Mail");
export const MapPin = glyph("MapPin");
export const MapPinned = glyph("MapPinned");
export const Megaphone = glyph("Megaphone");
export const Menu = glyph("Menu");
export const MessageCircle = glyph("MessageCircle");
export const MessageSquareLock = glyph("MessageSquareLock");
export const MessageSquareText = glyph("MessageSquareText");
export const Minus = glyph("Minus");
export const MonitorSmartphone = glyph("MonitorSmartphone");
export const MoreHorizontal = glyph("MoreHorizontal");
export const Package = glyph("Package");
export const PackageCheck = glyph("PackageCheck");
export const Palette = glyph("Palette");
export const PanelLeftClose = glyph("PanelLeftClose");
export const PanelLeftOpen = glyph("PanelLeftOpen");
export const Pause = glyph("Pause");
export const Pencil = glyph("Pencil");
export const Phone = glyph("Phone");
export const Pilcrow = glyph("Pilcrow");
export const Play = glyph("Play");
export const Plus = glyph("Plus");
export const Power = glyph("Power");
export const QrCode = glyph("QrCode");
export const Quote = glyph("Quote");
export const Radar = glyph("Radar");
export const RadioTower = glyph("RadioTower");
export const Redo2 = glyph("Redo2");
export const RefreshCw = glyph("RefreshCw");
export const RemoveFormatting = glyph("RemoveFormatting");
export const RotateCcw = glyph("RotateCcw");
export const Route = glyph("Route");
export const Save = glyph("Save");
export const Scale = glyph("Scale");
export const ScanFace = glyph("ScanFace");
export const Search = glyph("Search");
export const Send = glyph("Send");
export const Server = glyph("Server");
export const ServerCog = glyph("ServerCog");
export const Settings = glyph("Settings");
export const Shield = glyph("Shield");
export const ShieldAlert = glyph("ShieldAlert");
export const ShieldCheck = glyph("ShieldCheck");
export const ShieldX = glyph("ShieldX");
export const ShoppingBag = glyph("ShoppingBag");
export const ShoppingBasket = glyph("ShoppingBasket");
export const SkipForward = glyph("SkipForward");
export const SlidersHorizontal = glyph("SlidersHorizontal");
export const Smartphone = glyph("Smartphone");
export const SmartphoneNfc = glyph("SmartphoneNfc");
export const Sparkles = glyph("Sparkles");
export const Star = glyph("Star");
export const Store = glyph("Store");
export const Tag = glyph("Tag");
export const Target = glyph("Target");
export const Terminal = glyph("Terminal");
export const TimerReset = glyph("TimerReset");
export const Trash2 = glyph("Trash2");
export const TrendingUp = glyph("TrendingUp");
export const TriangleAlert = glyph("TriangleAlert");
export const Trophy = glyph("Trophy");
export const Truck = glyph("Truck");
export const Underline = glyph("Underline");
export const Undo2 = glyph("Undo2");
export const UnlockKeyhole = glyph("UnlockKeyhole");
export const Upload = glyph("Upload");
export const UserCog = glyph("UserCog");
export const UserPlus = glyph("UserPlus");
export const UserRound = glyph("UserRound");
export const UserRoundCheck = glyph("UserRoundCheck");
export const UserX = glyph("UserX");
export const Users = glyph("Users");
export const UsersRound = glyph("UsersRound");
export const UtensilsCrossed = glyph("UtensilsCrossed");
export const WalletCards = glyph("WalletCards");
export const WifiOff = glyph("WifiOff");
export const Wrench = glyph("Wrench");
export const X = glyph("X");
export const XCircle = glyph("XCircle");
export const Zap = glyph("Zap");
export const adminAccessToken = glyph("adminAccessToken");
export const coreAdminLogout = glyph("coreAdminLogout");
export const hasCoreAdminSession = glyph("hasCoreAdminSession");
export const BadgePercent = glyph("BadgePercent");
export const ImagePlus = glyph("ImagePlus");
export const Bell = glyph("Bell");
export const ClipboardCheck = glyph("ClipboardCheck");
