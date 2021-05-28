/**
 * Describe an example and all the useful information about it.
 */
export interface Example {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  projectFileUrl: string;
  license: string;
  tags: string[];
  previewImageUrls: string[];
  gdevelopVersion: string;
}

/**
 * Describe an example with less information, just enough to display
 * an example in a list to the user.
 */
export interface ExampleShortHeader {
  id: string;
  name: string;
  shortDescription: string;
  license: string;
  tags: string[];
  previewImageUrls: string[];
  gdevelopVersion: string;
}
