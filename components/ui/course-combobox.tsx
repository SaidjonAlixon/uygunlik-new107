"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Course } from "@/types/course"

interface CourseComboboxProps {
  courses: Course[];
  selectedCourses: string[];
  onChange: (selected: string[]) => void;
}

export function CourseCombobox({ courses, selectedCourses, onChange }: CourseComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (currentValue: string) => {
    const newSelectedCourses = selectedCourses.includes(currentValue)
      ? selectedCourses.filter((id) => id !== currentValue)
      : [...selectedCourses, currentValue];
    onChange(newSelectedCourses);
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
          {selectedCourses.length > 0
            ? `${selectedCourses.length} ta kurs tanlandi`
            : "Kurs tanlash..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Kurs qidirish..." />
          <CommandEmpty>Kurs topilmadi.</CommandEmpty>
          <CommandGroup>
            {courses.map((course) => (
              <CommandItem
                key={course.id}
                value={String(course.id)}
                onSelect={handleSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedCourses.includes(String(course.id)) ? "opacity-100" : "opacity-0"
                  )}
                />
                {course.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
