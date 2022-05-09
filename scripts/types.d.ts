/**
 * Describe an example and all the useful information about it.
 */
export interface Example {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  license: string;
  tags: string[];
  authorIds: string[];
  previewImageUrls: string[];
  gdevelopVersion: string;

  description: string;
  projectFileUrl: string;

  usedExtensions: Array<{ name: string; fullName: string }>;
  eventsBasedExtensions: Array<{ name: string; fullName: string }>;
}

/**
 * Describe an example with less information, just enough to display
 * an example in a list to the user.
 */
export interface ExampleShortHeader {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  license: string;
  tags: string[];
  authorIds: string[];
  previewImageUrls: string[];
  gdevelopVersion: string;
}

export type gdProject = any;
export type gdPlatformExtension = any;
export type libGDevelop = any;
