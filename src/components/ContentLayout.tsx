interface ContentLayoutProps {
  title?: string; // Title is now optional since Navbar is in main layout
  children: React.ReactNode;
}

export function ContentLayout({ children }: ContentLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-[#0F0F0F] overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* <div className="container max-w-5xl rounded-t-lg mx-auto px-5 bg-[#0F0F0F] border border-[#1e1e1e]"> */}
          {children}
        {/* </div> */}
      </div>
    </div>
  );
}
