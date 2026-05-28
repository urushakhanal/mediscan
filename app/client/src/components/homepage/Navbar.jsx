import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Stethoscope,
  Menu,
  X,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Bell,
  CheckCheck,
  Dot,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { changePassword } from "../../lib/auth";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../lib/notifications";
import { formatUserDisplayName } from "../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const NOTIFICATION_CATEGORY_ORDER = ["urgent", "requests", "updates", "other"];

const NOTIFICATION_CATEGORY_META = {
  urgent: {
    label: "Urgent",
    description: "Needs attention now",
    tone: "rose",
  },
  requests: {
    label: "Requests",
    description: "Pending booking actions",
    tone: "amber",
  },
  updates: {
    label: "Updates",
    description: "Status changes and confirmations",
    tone: "cyan",
  },
  other: {
    label: "Other",
    description: "General activity",
    tone: "slate",
  },
};

const REQUEST_TYPES = new Set([
  "appointment-request",
  "appointment-reschedule-request",
  "appointment-cancel-request",
  "care-plan-booking-request",
  "scan-request",
]);

const UPDATE_TYPES = new Set([
  "appointment-confirmed",
  "appointment-rejected",
  "appointment-rescheduled",
  "appointment-reschedule-approved",
  "appointment-cancelled",
  "appointment-completed",
  "appointment-reminder",
  "follow-up",
]);

const getNotificationCategory = (notification) => {
  if (REQUEST_TYPES.has(notification?.type)) {
    return notification?.isRead ? "requests" : "urgent";
  }

  if (UPDATE_TYPES.has(notification?.type)) {
    return "updates";
  }

  return "other";
};

const getNotificationThreadKey = (notification) => {
  const metadata = notification?.metadata || {};
  return [
    notification?.type || "notification",
    metadata.appointmentId || metadata.carePlanBookingId || "",
    metadata.patientId || "",
    metadata.doctorId || "",
    notification?.link || "",
  ].join(":");
};

const getNotificationCategoryToneClass = (tone, isActive = false) => {
  const toneClasses = {
    rose: isActive
      ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
      : "border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200",
    amber: isActive
      ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
      : "border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200",
    cyan: isActive
      ? "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200"
      : "border-cyan-200 bg-cyan-50/70 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-200",
    slate: isActive
      ? "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300",
  };

  return toneClasses[tone] || toneClasses.slate;
};

const getNotificationPreviewLabel = (notification) => {
  const type = notification?.type || "";

  if (type === "appointment-request") return "New booking";
  if (type === "appointment-reschedule-request") return "Reschedule request";
  if (type === "appointment-cancel-request") return "Cancellation request";
  if (type === "care-plan-booking-request") return "Care plan request";
  if (type === "scan-request") return "Scan request";
  if (type === "appointment-rescheduled") return "Rescheduled";
  if (type === "appointment-reschedule-approved") return "Reschedule approved";
  if (type === "appointment-cancelled") return "Cancelled";
  if (type === "appointment-reminder") return "Reminder";
  if (type === "follow-up") return "Follow-up";
  if (type === "appointment-confirmed") return "Confirmed";
  if (type === "appointment-rejected") return "Rejected";
  if (type === "appointment-completed") return "Completed";

  return notification?.title || "Notification";
};

const getUserInitials = (name) => {
  if (!name || typeof name !== "string") return "U";

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "U";

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
};

const Button = ({ children, className, variant = "default", ...props }) => {
  const base = "px-4 py-2 rounded-full font-medium transition-all duration-300";
  const variants = {
    default: "bg-gradient-to-r from-primary to-secondary text-white hover:from-primary-dark hover:to-secondary-dark",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
    ghost: "bg-transparent text-primary hover:bg-primary-light",
  };
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationFilter, setNotificationFilter] = useState("priority");
  const [expandedCategories, setExpandedCategories] = useState({
    urgent: true,
    requests: false,
    updates: false,
    other: false,
  });
  const [expandedGroups, setExpandedGroups] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const dropdownRef = useRef();
  const notificationsRef = useRef();
  const lastScrollY = useRef(0);

  const navItems = [
    { label: "Home", type: "link", to: "/" },
    { label: "Doctors", type: "link", to: "/doctors" },
    { label: "Care Plans", type: "link", to: "/care-plans" },
    { label: "How It Works", type: "scroll" },
    { label: "Contact", type: "scroll" },
  ];

  const dashboardPath = user?.role === "doctor"
    ? "/doctor/overview"
    : user?.role === "patient"
      ? "/patient/overview"
      : user?.role === "superadmin"
        ? "/admin/dashboard"
        : null;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 16);

      if (currentScrollY <= 16) {
        setNavVisible(true);
      } else if (currentScrollY < lastScrollY.current) {
        setNavVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setNavVisible(false);
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  const loadNotifications = useCallback(
    async ({ withSpinner = false } = {}) => {
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        if (withSpinner) {
          setNotificationsLoading(true);
        }

        setNotificationsError("");
        const [notificationData, countData] = await Promise.all([
          getMyNotifications(20),
          getUnreadNotificationCount(),
        ]);

        setNotifications(notificationData.notifications || []);
        setUnreadCount(countData.unreadCount || 0);
      } catch (error) {
        setNotificationsError(error.message || "Unable to load notifications.");
      } finally {
        if (withSpinner) {
          setNotificationsLoading(false);
        }
      }
    },
    [user]
  );

  const openNotifications = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setNotificationsOpen(true);
    await loadNotifications({ withSpinner: true });
  };

  const closeNotifications = () => {
    setNotificationsOpen(false);
  };

  const handleNotificationClick = async (notification) => {
    let markedAsRead = false;
    try {
      if (!notification?.isRead) {
        await markNotificationAsRead(notification._id);
        markedAsRead = true;
      }
    } catch (error) {
      toast.error(error.message || "Unable to open notification.");
    } finally {
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }
          : item
        )
      );
      if (markedAsRead) {
        setUnreadCount((current) => Math.max(current - 1, 0));
      }
      setNotificationsOpen(false);
      if (notification?.link) {
        navigate(notification.link);
      }
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() })));
      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error(error.message || "Unable to update notifications.");
    }
  };

  const groupedNotifications = useMemo(() => {
    const filtered = notifications.filter((notification) => {
      if (notificationFilter === "unread") {
        return !notification.isRead;
      }

      return true;
    });

    const groups = new Map();

    filtered.forEach((notification) => {
      const category = getNotificationCategory(notification);
      const threadKey = getNotificationThreadKey(notification);
      const groupKey = `${category}:${threadKey}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          category,
          items: [],
          unreadCount: 0,
          latestAt: 0,
        });
      }

      const group = groups.get(groupKey);
      group.items.push(notification);
      if (!notification.isRead) {
        group.unreadCount += 1;
      }

      const timestamp = new Date(notification.createdAt || 0).getTime();
      if (timestamp > group.latestAt) {
        group.latestAt = timestamp;
      }
    });

    const groupedByCategory = NOTIFICATION_CATEGORY_ORDER.reduce((acc, category) => {
      acc[category] = [];
      return acc;
    }, {});

    [...groups.values()]
      .map((group) => ({
        ...group,
        latest: [...group.items].sort(
          (left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
        )[0],
      }))
      .sort((left, right) => {
        const categoryOrderDiff =
          NOTIFICATION_CATEGORY_ORDER.indexOf(left.category) - NOTIFICATION_CATEGORY_ORDER.indexOf(right.category);
        if (categoryOrderDiff !== 0) {
          return categoryOrderDiff;
        }

        return right.latestAt - left.latestAt;
      })
      .forEach((group) => {
        groupedByCategory[group.category].push(group);
      });

    return groupedByCategory;
  }, [notificationFilter, notifications]);

  const categorySummaries = useMemo(
    () =>
      NOTIFICATION_CATEGORY_ORDER.map((category) => {
        const groups = groupedNotifications[category] || [];
        const itemCount = groups.reduce((total, group) => total + group.items.length, 0);
        const unreadGroupCount = groups.reduce((total, group) => total + group.unreadCount, 0);

        return {
          category,
          meta: NOTIFICATION_CATEGORY_META[category],
          itemCount,
          unreadGroupCount,
          groups,
        };
      }),
    [groupedNotifications]
  );

  const logout = async () => {
    try {
      await signOut();
    } finally {
      setMobileMenuOpen(false);
      navigate("/signin");
    }
  };

  const openChangePasswordModal = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setPasswordError("");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordVisibility({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
    setChangePasswordOpen(true);
  };

  const handlePasswordFieldChange = (event) => {
    const { id, value } = event.target;
    setPasswordError("");
    setPasswordForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password must match.");
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password updated successfully.");
      setChangePasswordOpen(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordVisibility({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });
    } catch (error) {
      const firstError = error?.data?.errors?.[0];
      setPasswordError(firstError || error.message || "Unable to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    loadNotifications({ withSpinner: true });
  }, [loadNotifications]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      loadNotifications();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [loadNotifications, user]);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-40 border-b border-transparent px-4 py-2.5 transition-transform duration-300 md:px-8 md:py-3",
      navVisible ? "translate-y-0" : "-translate-y-full",
      scrolled
        ? "border-teal-100/80 bg-teal-50/95 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/95"
        : "bg-teal-50/90 backdrop-blur-sm dark:bg-gray-900/90"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-70"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-full p-1">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
          </div>
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            MediScan
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item, index) =>
            item.type === "link" ? (
              <Link key={index} to={item.to} className="text-gray-700 dark:text-gray-100 hover:text-primary transition-colors relative group">
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ) : (
              <button
                key={index}
                onClick={() =>
                  document.getElementById(item.label.toLowerCase().replace(/\s+/g, "-"))?.scrollIntoView({ behavior: "smooth" })
                }
                className="text-gray-700 dark:text-gray-100 hover:text-primary transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
              </button>
            )
          )}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-4 relative">
          <div ref={notificationsRef} className="relative">
            <button
              onClick={notificationsOpen ? closeNotifications : openNotifications}
              className="relative p-2 text-primary transition hover:text-primary-dark dark:text-primary dark:hover:text-primary-light"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 inline-flex min-w-5 -translate-y-1/3 translate-x-1/3 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white dark:border-slate-900">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full z-50 mt-3 w-[20.5rem] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_-35px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-3.5 py-3 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-900 dark:text-white">Notifications</p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleMarkAllNotificationsRead}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark all read
                    </button>
                  </div>

                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {[
                      { id: "priority", label: "Priority" },
                      { id: "unread", label: "Unread" },
                      { id: "all", label: "All" },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setNotificationFilter(filter.id)}
                        className={cn(
                          "whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                          notificationFilter === filter.id
                            ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                        )}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-h-[28rem] overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-3.5 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      Loading notifications...
                    </div>
                  ) : notificationsError ? (
                    <div className="px-3.5 py-8 text-center text-xs text-rose-600 dark:text-rose-300">
                      {notificationsError}
                    </div>
                  ) : groupedNotifications && categorySummaries.every((summary) => summary.groups.length === 0) ? (
                    <div className="px-3.5 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    <div className="space-y-2 px-2.5 py-2.5">
                      {categorySummaries.map((summary) => {
                        if (notificationFilter === "priority" && summary.category === "other" && summary.groups.length === 0) {
                          return null;
                        }

                        const isExpanded = Boolean(expandedCategories[summary.category]);
                        const isShowingAll = Boolean(expandedGroups[summary.category]);
                        const visibleGroups = isExpanded
                          ? summary.groups.slice(0, isShowingAll ? summary.groups.length : 4)
                          : [];
                        const hiddenCount = summary.groups.length - visibleGroups.length;

                        if (notificationFilter === "priority" && summary.category === "other" && summary.groups.length === 0) {
                          return null;
                        }

                        if (summary.groups.length === 0) {
                          return null;
                        }

                        return (
                          <section
                            key={summary.category}
                            className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_12px_28px_-22px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCategories((current) => ({
                                  ...current,
                                  [summary.category]: !current[summary.category],
                                }))
                              }
                              className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getNotificationCategoryToneClass(
                                      summary.meta.tone,
                                      summary.category === "urgent"
                                    )}`}
                                  >
                                    {summary.meta.label}
                                  </span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {summary.itemCount} item{summary.itemCount === 1 ? "" : "s"}
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  {summary.meta.description}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {summary.unreadGroupCount > 0 && (
                                  <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                    {summary.unreadGroupCount}
                                  </span>
                                )}
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {isExpanded ? "Hide" : "Show"}
                                </span>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {visibleGroups.map((group) => {
                                  const latest = group.latest;
                                  const createdLabel = latest?.createdAt ? new Date(latest.createdAt).toLocaleString() : "";

                                  return (
                                    <button
                                      key={`${summary.category}:${group.latestAt}:${group.items[0]?._id || "group"}`}
                                      type="button"
                                      onClick={() => handleNotificationClick(latest)}
                                      className={[
                                        "block w-full px-3.5 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70",
                                        latest?.isRead ? "bg-white dark:bg-slate-900" : "bg-cyan-50/60 dark:bg-cyan-950/20",
                                      ].join(" ")}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="mt-1 text-cyan-600 dark:text-cyan-300">
                                          <Dot className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-start justify-between gap-3">
                                            <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                              {getNotificationPreviewLabel(latest)}
                                            </p>
                                            <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                                              {createdLabel}
                                            </span>
                                          </div>
                                          <p className="mt-1 max-h-10 overflow-hidden text-xs leading-5 text-slate-600 dark:text-slate-300">
                                            {latest?.message}
                                          </p>
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            <span className="inline-flex rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                              {group.items.length} update{group.items.length === 1 ? "" : "s"}
                                            </span>
                                            {group.unreadCount > 0 && (
                                              <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                                {group.unreadCount} unread
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}

                                {hiddenCount > 0 && !isShowingAll && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedGroups((current) => ({
                                        ...current,
                                        [summary.category]: true,
                                      }))
                                    }
                                    className="block w-full bg-slate-50 px-3.5 py-2.5 text-left text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    Show {hiddenCount} more
                                  </button>
                                )}
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={toggleDarkMode} className="p-2 text-primary transition hover:text-primary-dark dark:text-primary dark:hover:text-primary-light">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-primary/30 bg-white/80 px-3 py-1.5 dark:border-primary/40 dark:bg-gray-800/80"
              >
                <div className="bg-primary text-white w-9 h-9 rounded-full flex items-center justify-center font-semibold uppercase">
                  {getUserInitials(user.name)}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-100">
                  {formatUserDisplayName(user)}
                </span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-200">
                    {formatUserDisplayName(user)}
                  </div>
                  <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <button
                    onClick={openChangePasswordModal}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800"
                  >
                    Change password
                  </button>
                  {dashboardPath && (
                    <Link
                      to={dashboardPath}
                      onClick={() => setDropdownOpen(false)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/signin"><Button variant="outline">Login</Button></Link>
              <Link to="/signup"><Button>Sign Up</Button></Link>
            </>
          )}
        </div>

        {/* Mobile: Dark Mode + Hamburger */}
        <div className="md:hidden flex items-center gap-2 ml-auto">
          <button onClick={toggleDarkMode} className="p-2 text-primary transition hover:text-primary-dark dark:text-primary dark:hover:text-primary-light" title="Toggle Dark Mode">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Button variant="ghost" className="p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6 text-gray-800 dark:text-white" /> : <Menu className="w-6 h-6 text-gray-800 dark:text-white" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div ref={dropdownRef} className="md:hidden bg-white dark:bg-gray-800 px-4 py-4 shadow-md rounded-b-lg mt-2 space-y-4">
          {navItems.map((item, index) =>
            item.type === "link" ? (
              <Link
                key={index}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 dark:text-white"
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={index}
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById(item.label.toLowerCase().replace(/\s+/g, "-"))?.scrollIntoView({ behavior: "smooth" });
                }}
                className="block w-full text-left text-gray-700 dark:text-white"
              >
                {item.label}
              </button>
            )
          )}

          {user ? (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                <div className="bg-primary text-white w-9 h-9 rounded-full flex items-center justify-center font-semibold uppercase">
                  {getUserInitials(user.name)}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-100">
                  {formatUserDisplayName(user)}
                </span>
              </div>
              <button onClick={openChangePasswordModal} className="block text-left text-primary">Change password</button>
              {dashboardPath && (
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-primary"
                >
                  Dashboard
                </Link>
              )}
              <button onClick={logout} className="block text-left text-red-600">Logout</button>
            </>
          ) : (
            <>
              <Link to="/signin" onClick={() => setMobileMenuOpen(false)} className="block text-primary">Login</Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block text-primary">Sign Up</Link>
            </>
          )}
        </div>
      )}

      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="rounded-[1.75rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
          <div className="p-6">
            <DialogHeader>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Account Security</p>
              <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Change password
              </DialogTitle>
              <DialogDescription>
                Update your account password. Your new password must be at least 8 characters long.
              </DialogDescription>
            </DialogHeader>

            <form className="mt-5 space-y-4" onSubmit={handleChangePassword}>
              {passwordError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                  {passwordError}
                </div>
              )}

              <div>
                <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Current password
                </label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={passwordVisibility.currentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordFieldChange}
                    className="h-11 rounded-xl border-slate-300 bg-white pr-11 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisibility((prev) => ({ ...prev, currentPassword: !prev.currentPassword }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                    aria-label="Toggle current password visibility"
                  >
                    {passwordVisibility.currentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  New password
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={passwordVisibility.newPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFieldChange}
                    className="h-11 rounded-xl border-slate-300 bg-white pr-11 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisibility((prev) => ({ ...prev, newPassword: !prev.newPassword }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                    aria-label="Toggle new password visibility"
                  >
                    {passwordVisibility.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Confirm new password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={passwordVisibility.confirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordFieldChange}
                    className="h-11 rounded-xl border-slate-300 bg-white pr-11 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisibility((prev) => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                    aria-label="Toggle confirm password visibility"
                  >
                    {passwordVisibility.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {passwordLoading ? "Updating..." : "Update password"}
                </button>
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  disabled={passwordLoading}
                  className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Navbar;
