// import { Navbar } from "./Navbar";


// interface ContentLayoutProps {
//   title: string;
//   children: React.ReactNode;
// }

// export function ContentLayout({ title, children }: ContentLayoutProps) {
//   return (
//     <div className="bg-[#0F0F0F] flex flex-col h-full overflow-hidden">
//       {/* @ts-ignore */}
//       <Navbar title={"New Grant Application"} />
//       {/* Ensure the content takes up the full remaining height and can scroll inside */}
//       <div className="bg-background relative flex flex-col w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-12">
//         {children}
//       </div>
//     </div>
//   );
// }



import { Navbar } from "./Navbar";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-[#0F0F0F] overflow-hidden">
      <Navbar title={title} />

      {/* This must be “flex-1 min-h-0 overflow-hidden” so that
          child steps can scroll inside it rather than leaking to body */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
