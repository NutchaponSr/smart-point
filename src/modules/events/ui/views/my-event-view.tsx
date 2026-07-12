"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { EventFilters } from "@/modules/events/ui/components/event-filters";
import { EventCarousel } from "@/modules/events/ui/components/event-carousel";
import { MyEventScreen } from "@/modules/events/ui/screens/my-event-screen";
import { AllEventsScreen } from "@/modules/events/ui/screens/all-events-screen";
import { Currencies } from "@/modules/cart/ui/components/currency";

export const MyEventView = () => {
  return (
    <div className="flex flex-col gap-6 px-6">
      <div className="flex flex-col gap-6 lg:flex-row-reverse lg:gap-12">
        <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-6 lg:z-1 lg:w-[368px] lg:shrink-0 lg:self-start">
          <div className="mb-2 flex h-11 flex-row items-center justify-between">
            <Currencies />
          </div>
          <EventFilters />
        </aside>

        <div className="z-0 min-w-0 flex-1">
          <div className="grid gap-6 lg:gap-8">
            <header className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-[#0003] bg-[#58cc02] p-4">
              <div className="grid min-w-0 gap-1">
                <h2 className="text-xl font-bold text-white sm:text-2xl">
                  กิจกรรมสำหรับ BU / สังกัดของคุณ
                </h2>
                <p className="text-sm text-white/90">
                  แสดงเฉพาะกิจกรรมที่เปิดให้ BU หรือสังกัดของคุณเข้าร่วม
                </p>
              </div>
            </header>
            <EventCarousel />

            <Tabs defaultValue="all">
              <TabsList
                variant="line"
                className="w-full justify-start gap-2 overflow-x-auto h-full"
              >
                <TabsTrigger
                  value="all"
                  className="min-h-12 flex-none rounded-md border-2 border-transparent bg-transparent px-4 py-2 text-base font-bold text-primary after:hidden hover:bg-[#f7f7f7] hover:text-primary data-active:border-[#84d8ff] data-active:bg-[#ddf4ff] data-active:text-[#1cb0f6] hover:data-active:text-[#1cb0f6]"
                >
                  กิจกรรมที่เข้าร่วมได้
                </TabsTrigger>
                <TabsTrigger
                  value="joined"
                  className="min-h-12 flex-none rounded-md border-2 border-transparent bg-transparent px-4 py-2 text-base font-bold text-primary after:hidden hover:bg-[#f7f7f7] hover:text-primary data-active:border-[#84d8ff] data-active:bg-[#ddf4ff] data-active:text-[#1cb0f6] hover:data-active:text-[#1cb0f6]"
                >
                  เข้าร่วมแล้ว
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="pt-2">
                <AllEventsScreen />
              </TabsContent>
              <TabsContent value="joined" className="pt-2">
                <MyEventScreen />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};
