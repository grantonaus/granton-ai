// /icons/index.tsx
import * as React from "react";

type SVGIconProps = React.SVGProps<SVGSVGElement> & {
    size?: number;
};

export const NewApplicationIcon: React.FC<SVGIconProps> = ({
    size = 24,
    ...props
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        style={{ width: size, height: size }}
        fill="none"
        {...props}
    >
        <path
            d="M15 0C17.7614 0 20 2.23858 20 5V15C20 17.7614 17.7614 20 15 20H5C2.23858 20 0 17.7614 0 15V5C0 2.23858 2.23858 0 5 0H15Z"
            fill="currentColor"
            fillOpacity="0.1"
        />
        <path
            d="M10.5 7V10M10.5 13V10M10.5 10H13.5M10.5 10H7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.6"
        />
    </svg>
);

export const CompanyDetailsIcon: React.FC<SVGIconProps> = ({
    size = 24,
    ...props
}) => (
    <svg
        width={size}
        height={size}
        style={{ width: size, height: size }}
        viewBox="0 0 24 24"
        fill="none"
        {...props}
    >
        {/* background square */}
        <rect
            x="1"
            y="1"
            width="22"
            height="22"
            rx="6.6"
            fill="currentColor"
            fillOpacity="0.1"
        />
        {/* three centered lines, narrower */}
        <path
            d="M7 8H17" // width: 10 units
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.5"
        />
        <path
            d="M7 12H17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.5"
        />
        <path
            d="M7 16H15" // slightly shorter bottom line
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.5"
        />
    </svg>
);



export const PersonalDetailsIcon: React.FC<SVGIconProps> = ({
    size = 24,
    ...props
  }) => (
    <svg
      width={size}
      height={size}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      {/* Background square at 10% opacity */}
      <rect
        x="1"
        y="1"
        width="22"
        height="22"
        rx="6.6"
        fill="currentColor"
        fillOpacity="0.1"
      />
  
      {/* Head circle – now centered at x=12 */}
      <circle
        cx="2.28571"
        cy="2.28571"
        r="2.28571"
        /* “-1 0 0 1 14.2857 6” reflects across vertical axis + shifts right so center =12 */
        transform="matrix(-1 0 0 1 14.2857 6)"
        fill="currentColor"
        fillOpacity="0.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
  
      {/* 
        Shoulders shape:
        - original path ranged from x=7→15 (midpoint=11).
        - wrapping in translate(1 0) shifts midpoint →12.
      */}
      <g transform="translate(1 0)">
        <path
          d="M7 13.9627
             C7 13.4711 7.30906 13.0325 7.77205 12.8672
             V12.8672
             C9.85945 12.1217 12.1405 12.1217 14.2279 12.8672
             V12.8672
             C14.6909 13.0325 15 13.4711 15 13.9627
             V14.7145
             C15 15.393 14.399 15.9142 13.7273 15.8183
             L13.5034 15.7863
             C11.8429 15.5491 10.1571 15.5491 8.49665 15.7863
             L8.27269 15.8183
             C7.60097 15.9142 7 15.393 7 14.7145
             V13.9627
             Z"
          fill="currentColor"
          fillOpacity="0.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />
      </g>
    </svg>
  );



export const PastApplicationsIcon: React.FC<SVGIconProps> = ({
    size = 24,
    ...props
}) => (
    <svg
        width={size}
        height={size}
        style={{ width: size, height: size }}
        viewBox="0 0 24 24"
        fill="none"
        {...props}
    >
        {/* Background square */}
        <rect
            x="1"
            y="1"
            width="22"
            height="22"
            rx="6.6"
            fill="currentColor"
            fillOpacity="0.1"
        />

        {/* Three vertical bars */}
        <rect
            x="6.5"
            y="12"
            width="2"
            height="6"
            rx="1"
            fill="currentColor"
            fillOpacity="0.5"
        />
        <rect
            x="11"
            y="6"
            width="2"
            height="12"
            rx="1"
            fill="currentColor"
            fillOpacity="0.5"
        />
        <rect
            x="15.5"
            y="9"
            width="2"
            height="9"
            rx="1"
            fill="currentColor"
            fillOpacity="0.5"
        />
    </svg>
);





// /icons/index.tsx
export const MatchingGrantsIcon: React.FC<SVGIconProps> = ({
    size = 24,
    ...props
  }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      style={{ width: size, height: size }}
      {...props}
    >
      {/* Background */}
      <rect
        width="22"
        height="22"
        rx="6.6"
        fill="currentColor"
        fillOpacity="0.1"
      />
      {/* Arrow icon for matching logic */}
      <path
        d="M12.0077 10.2895C11.8972 10.2895 11.8077 10.2 11.8077 10.0895V7.0558C11.8077 6.86835 11.573 6.7839 11.4535 6.92837L8.17675 10.8919C7.90722 11.2179 8.13911 11.7105 8.56211 11.7105H9.99231C10.1028 11.7105 10.1923 11.8 10.1923 11.9105V14.9442C10.1923 15.1316 10.427 15.2161 10.5465 15.0716L13.8232 11.1081C14.0928 10.7821 13.8609 10.2895 13.4379 10.2895H12.0077Z"
        fill="currentColor"
        fillOpacity="0.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
    </svg>
  );
  


//   <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
// <rect width="22" height="22" rx="6.6" fill="#6D6D6D"/>
// <circle cx="2.28571" cy="2.28571" r="2.28571" transform="matrix(-1 0 0 1 13.2857 6)" fill="#111111" stroke="#111111" stroke-width="1.5"/>
// <path d="M7 13.9627C7 13.4711 7.30906 13.0325 7.77205 12.8672V12.8672C9.85945 12.1217 12.1405 12.1217 14.2279 12.8672V12.8672C14.6909 13.0325 15 13.4711 15 13.9627V14.7145C15 15.393 14.399 15.9142 13.7273 15.8183L13.5034 15.7863C11.8429 15.5491 10.1571 15.5491 8.49665 15.7863L8.27269 15.8183C7.60097 15.9142 7 15.393 7 14.7145V13.9627Z" fill="#111111" stroke="#111111" stroke-width="1.5"/>
// </svg>



// re-export lucide icons with the same API
export { Bookmark, GalleryVertical, Plus } from "lucide-react";
