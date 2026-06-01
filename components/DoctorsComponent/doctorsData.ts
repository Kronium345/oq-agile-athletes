export type Doctor = {
  uri: string;
  name: string;
  specialist: string;
  epxperience: string;
  location: string;
};

export const doctors: Doctor[] = [
  {
    uri: 'https://www.rcpsych.ac.uk/images/default-source/about-us/what-we-do/default-image.jpg',
    name: 'Dr. Sarah Johnson',
    specialist: 'Psychiatrist',
    epxperience: '15 Years Experience',
    location: 'Royal College of Psychiatrists, London',
  },
  {
    uri: 'https://www.bps.org.uk/sites/www.bps.org.uk/files/Member%20Networks/Divisions/DCP/DCP%20logo.jpg',
    name: 'Dr. James Williams',
    specialist: 'Clinical Psychologist',
    epxperience: '12 Years Experience',
    location: 'British Psychological Society, Leicester',
  },
  {
    uri: 'https://www.mentalhealth.org.uk/sites/default/files/styles/content_image_medium/public/2022-06/MHF_Logo_Stacked_RGB.png',
    name: 'Dr. Emma Thompson',
    specialist: 'Psychiatrist',
    epxperience: '10 Years Experience',
    location: 'Mental Health Foundation, Glasgow',
  },
  {
    uri: 'https://www.mind.org.uk/media/7348/mind-logo-blue-transparent.png',
    name: 'Dr. Michael Roberts',
    specialist: 'Psychotherapist',
    epxperience: '8 Years Experience',
    location: 'Mind Charity, London',
  },
  {
    uri: 'https://www.nhs.uk/nhsengland/shared/images/nhs-logo-desktop.svg',
    name: 'Dr. Elizabeth Clarke',
    specialist: 'NHS Mental Health Specialist',
    epxperience: '14 Years Experience',
    location: 'NHS Mental Health Services, Manchester',
  },
];
