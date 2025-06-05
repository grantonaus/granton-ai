import { UserAvatar } from "./UserAvatar"


type UserWidgetProps = {
  image: string
  name: string
  userid?: string
}

export const UserWidget = ({ image, name, userid }: UserWidgetProps) => {
  
  return (
    <div className="items-center flex">
      <UserAvatar userid={userid} name={name} image={image} />
    </div>
  )
}