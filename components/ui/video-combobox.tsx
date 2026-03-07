"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Video } from "@/types/video"

interface VideoComboboxProps {
  videos: Video[];
  selectedVideos: string[];
  onChange: (selected: string[]) => void;
}

export function VideoCombobox({ videos, selectedVideos, onChange }: VideoComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (currentValue: string) => {
    const newSelectedVideos = selectedVideos.includes(currentValue)
      ? selectedVideos.filter((id) => id !== currentValue)
      : [...selectedVideos, currentValue];
    onChange(newSelectedVideos);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedVideos.length > 0
            ? `${selectedVideos.length} ta video tanlandi`
            : "Video tanlash..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Video qidirish..." />
          <CommandEmpty>Video topilmadi.</CommandEmpty>
          <CommandGroup>
            {videos.map((video) => (
              <CommandItem
                key={video.id}
                value={String(video.id)}
                onSelect={handleSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedVideos.includes(String(video.id)) ? "opacity-100" : "opacity-0"
                  )}
                />
                {video.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
