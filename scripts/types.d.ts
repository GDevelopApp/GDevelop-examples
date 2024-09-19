export interface ExampleUsedExtension {
  name: string;
  fullName: string;
  helpPath: string;
  iconUrl: string;
  category: string;
}

export interface ExampleEventsBasedExtension {
  name: string;
  fullName: string;
  helpPath: string;
  previewIconUrl: string;
  authorIds: string[];
  category: string;
}

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
  quickCustomizationImageUrl?: string;
  gdevelopVersion: string;
  codeSizeLevel: string;
  difficultyLevel: string | undefined;

  description: string;
  projectFileUrl: string;

  usedExtensions: Array<ExampleUsedExtension>;
  eventsBasedExtensions: Array<ExampleEventsBasedExtension>;
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
  codeSizeLevel: string;
  difficultyLevel: string | undefined;
}

export type gdProject = any;
export type gdPlatformExtension = any;
export type libGDevelop = any;
