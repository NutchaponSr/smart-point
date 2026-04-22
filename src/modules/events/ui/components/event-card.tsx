import placeholder from "../../../../../public/placeholder.png";

import { ApiOutputs } from "@convex/api";
import { GoPersonFill } from "react-icons/go";

interface Props {
  activity: ApiOutputs["activity"]["getMany"]["page"][0];
}

export const EventCard = ({ activity }: Props) => {
  return (
    <article className="relative flex flex-col rounded-xs border-2 border-border bg-background transition-all duration-150 hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,0_0_#0000,.25rem_.25rem_0_rgba(0,0,0,1)]">
      <figure className="aspect-square overflow-hidden rounded-t-xs border-b-2 border-border [&_img]:size-full [&_img]:object-cover">
        <img src={placeholder.src} alt={activity.name} loading="lazy" />
      </figure>
      <header className="flex flex-1 flex-col gap-3 border-b-2 border-border p-4">
        <a href={`/events/${activity._id}`} className="no-underline before:absolute before:content-[''] before:inset-0">
          <h3 className="leading-snug text-lg font-normal">{activity.name}</h3>
        </a>
      </header>
      <footer className="flex">
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2 min-h-8">
            {activity.maxParticipants ? (
              <>
                <GoPersonFill className="size-4.5 stroke-[0.25]" />
                <span className="text-base font-normal">{activity.participantCount} / {activity.maxParticipants}</span>
                {activity.participantCount === activity.maxParticipants && (
                  <div className="relative grid w-fit border-[1.5px] border-border ml-2">
                    <div className="bg-destructive px-2 py-1 text-white text-sm">
                      เต็ม
                    </div>
                  </div>
                )}
              </>
            ) : (
              <span className="text-base font-normal underline">ไม่จำกัด</span>
            )}
            {activity.isJoined && (
              <div className="relative grid w-fit border-[1.5px] border-border">
                <div className="bg-pink px-2 py-1 text-sm">
                  เข้าร่วมแล้ว
                </div>
              </div>
            )}
          </div>
        </div>
      </footer>
    </article>
  );
}