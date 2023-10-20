import { useState } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { faAngleUp, faAngleDown } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Authenticated({ user, header, children }) {
  const [showingNavigationDropdown, setShowingNavigationDropdown] =
    useState(false);
  const [angleUpDown, setAngleUpDown] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="shrink-0 flex items-center">
              <Link href="/">
                <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
              </Link>
            </div>
            <div className="nav-links hidden mx-4 gap-4 lg:gap-8 sm:overflow-scroll sm:flex ">
              <NavLink
                href={route("dashboard")}
                active={route().current("dashboard")}
              >
                Dashboard
              </NavLink>

              <NavLink href={route("chat")} active={route().current("chat")}>
                Chat
              </NavLink>

              <NavLink
                href={route("proofread")}
                active={route().current("proofread")}
              >
                Proofread
              </NavLink>

              <NavLink
                href={route("sys-coding")}
                active={route().current("sys-coding")}
              >
                SysCoding
              </NavLink>

              <NavLink
                href={route("lp-coding")}
                active={route().current("lp-coding")}
              >
                LpCoding
              </NavLink>

              <NavLink href={route("voice")} active={route().current("voice")}>
                Voice
              </NavLink>

              <NavLink
                href={route("banner")}
                active={route().current("banner")}
              >
                Banner
              </NavLink>

              <NavLink
                href={route("cg-modeling")}
                active={route().current("cg-modeling")}
              >
                CgModeling
              </NavLink>

              <NavLink href={route("cast")} active={route().current("cast")}>
                Cast
              </NavLink>

              <NavLink
                href={route("option")}
                active={route().current("option")}
              >
                Option
              </NavLink>
            </div>
            <div className="hidden sm:flex sm:items-center">
              <div className="relative">
                <Dropdown>
                  <Dropdown.Trigger>
                    <span className="inline-flex rounded-md">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
                      >
                        {user.name}

                        <svg
                          className="ml-2 -mr-0.5 h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </span>
                  </Dropdown.Trigger>
                  <Dropdown.Content>
                    <Dropdown.Link href={route("profile.edit")}>
                      Profile
                    </Dropdown.Link>
                    <Dropdown.Link
                      href={route("logout")}
                      method="post"
                      as="button"
                    >
                      Log Out
                    </Dropdown.Link>
                  </Dropdown.Content>
                </Dropdown>
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() =>
                  setShowingNavigationDropdown(
                    (previousState) => !previousState
                  )
                }
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
              >
                <svg
                  className="h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    className={
                      !showingNavigationDropdown ? "inline-flex" : "hidden"
                    }
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                  <path
                    className={
                      showingNavigationDropdown ? "inline-flex" : "hidden"
                    }
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div
          className={
            (showingNavigationDropdown ? "block" : "hidden") + " sm:hidden"
          }
        >
          <div className="pt-1 pb-1 space-y-1 border-t">
            <ResponsiveNavLink
              href={route("dashboard")}
              active={route().current("dashboard")}
            >
              Dashboard
            </ResponsiveNavLink>

            <ResponsiveNavLink
              href={route("chat")}
              active={route().current("chat")}
            >
              Chat
            </ResponsiveNavLink>

            <ResponsiveNavLink
              href={route("proofread")}
              active={route().current("proofread")}
            >
              Proofread
            </ResponsiveNavLink>

            <ResponsiveNavLink
              href={route("sys-coding")}
              active={route().current("sys-coding")}
            >
              SysCoding
            </ResponsiveNavLink>

            <ResponsiveNavLink
              href={route("lp-coding")}
              active={route().current("lp-coding")}
            >
              LpCoding
            </ResponsiveNavLink>

            <ResponsiveNavLink
              href={route("voice")}
              active={route().current("voice")}
            >
              Voice
            </ResponsiveNavLink>

            <ResponsiveNavLink
              href={route("banner")}
              active={route().current("banner")}
            >
              banner
            </ResponsiveNavLink>

            <ResponsiveNavLink
              href={route("cg-modeling")}
              active={route().current("cg-modeling")}
            >
              CgModeling
            </ResponsiveNavLink>

            <ResponsiveNavLink
              href={route("cast")}
              active={route().current("cast")}
            >
              Cast
            </ResponsiveNavLink>

            <ResponsiveNavLink
              href={route("option")}
              active={route().current("option")}
            >
              Option
            </ResponsiveNavLink>
          </div>

          <div className="pt-4 pb-1 border-t border-gray-200">
            <div className="px-4">
              <div className="font-medium text-base text-gray-800">
                {user.name}
              </div>
              <div className="font-medium text-sm text-gray-500">
                {user.email}
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <ResponsiveNavLink href={route("profile.edit")}>
                Profile
              </ResponsiveNavLink>
              <ResponsiveNavLink
                method="post"
                href={route("logout")}
                as="button"
              >
                Log Out
              </ResponsiveNavLink>
            </div>
          </div>
        </div>
      </nav>
      {header && (
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {header}
          </div>
        </header>
      )}

      <main className="flex-grow overflow-hidden">{children}</main>
    </div>
  );
}
