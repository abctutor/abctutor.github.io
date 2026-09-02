/* ==========================================================================
   Tutor roster + recurring weekly availability patterns.
   To add or edit a tutor, just edit this array — no build step needed.

   photo: leave "" to show a friendly colored initials avatar instead of a
   broken image. To use a real photo, drop the file in /assets/images and
   set photo to that path, e.g. "assets/images/jane.jpg".

   weeklyPattern: the tutor's *recurring* open hours, e.g. every Monday and
   Wednesday 4-5pm. booking.js turns this into real dated slots for the
   next NUM_DAYS_AHEAD days, then hides any slot already booked.
   dayOfWeek: 0 = Sunday ... 6 = Saturday.
   ========================================================================== */

const TUTORS = [
  {
    id: "t-amelia",
    name: "Amelia Chen",
    photo: "",
    avatarColor: "#2a9d8f",
    subjects: ["Math", "Algebra", "Geometry"],
    gradeLevels: ["Elementary (K-5)", "Middle School (6-8)"],
    hourlyRate: 35,
    bio: "Patient and encouraging — makes math feel doable, not scary.",
    weeklyPattern: [
      { dayOfWeek: 1, time: "3:30 PM" },
      { dayOfWeek: 1, time: "4:30 PM" },
      { dayOfWeek: 3, time: "3:30 PM" },
      { dayOfWeek: 3, time: "4:30 PM" },
      { dayOfWeek: 5, time: "10:00 AM" }
    ]
  },
  {
    id: "t-marcus",
    name: "Marcus Owusu",
    photo: "",
    avatarColor: "#f4a261",
    subjects: ["Reading", "Writing", "English"],
    gradeLevels: ["Elementary (K-5)"],
    hourlyRate: 30,
    bio: "Former elementary teacher who loves helping kids fall in love with reading.",
    weeklyPattern: [
      { dayOfWeek: 2, time: "3:00 PM" },
      { dayOfWeek: 2, time: "4:00 PM" },
      { dayOfWeek: 4, time: "3:00 PM" },
      { dayOfWeek: 4, time: "4:00 PM" },
      { dayOfWeek: 6, time: "9:00 AM" }
    ]
  },
  {
    id: "t-priya",
    name: "Priya Nair",
    photo: "",
    avatarColor: "#e76f51",
    subjects: ["Science", "Biology", "Chemistry"],
    gradeLevels: ["Middle School (6-8)", "High School (9-12)"],
    hourlyRate: 42,
    bio: "PhD candidate who breaks down tough science concepts step by step.",
    weeklyPattern: [
      { dayOfWeek: 1, time: "5:00 PM" },
      { dayOfWeek: 3, time: "5:00 PM" },
      { dayOfWeek: 5, time: "1:00 PM" },
      { dayOfWeek: 5, time: "2:00 PM" }
    ]
  },
  {
    id: "t-daniel",
    name: "Daniel Ruiz",
    photo: "",
    avatarColor: "#264653",
    subjects: ["Math", "Calculus", "Test Prep (SAT/ACT)"],
    gradeLevels: ["High School (9-12)"],
    hourlyRate: 45,
    bio: "Specializes in SAT/ACT prep and building test-day confidence.",
    weeklyPattern: [
      { dayOfWeek: 2, time: "5:30 PM" },
      { dayOfWeek: 4, time: "5:30 PM" },
      { dayOfWeek: 6, time: "10:00 AM" },
      { dayOfWeek: 6, time: "11:00 AM" }
    ]
  },
  {
    id: "t-grace",
    name: "Grace Kim",
    photo: "",
    avatarColor: "#8ab17d",
    subjects: ["Spanish", "French"],
    gradeLevels: ["Elementary (K-5)", "Middle School (6-8)", "High School (9-12)"],
    hourlyRate: 32,
    bio: "Bilingual tutor who uses games and conversation to build real confidence.",
    weeklyPattern: [
      { dayOfWeek: 1, time: "6:00 PM" },
      { dayOfWeek: 3, time: "6:00 PM" },
      { dayOfWeek: 4, time: "4:30 PM" }
    ]
  },
  {
    id: "t-victor",
    name: "Victor Adeyemi",
    photo: "",
    avatarColor: "#e9c46a",
    subjects: ["Computer Science", "Math"],
    gradeLevels: ["Middle School (6-8)", "High School (9-12)"],
    hourlyRate: 40,
    bio: "Software engineer who teaches coding and math with real-world projects.",
    weeklyPattern: [
      { dayOfWeek: 2, time: "4:00 PM" },
      { dayOfWeek: 5, time: "3:00 PM" },
      { dayOfWeek: 5, time: "4:00 PM" },
      { dayOfWeek: 6, time: "1:00 PM" }
    ]
  }
];
