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

export interface ExampleShortHeader {
  id: string;
  name: string;
  shortDescription: string;
  license: string;
  tags: string[];
  previewImageUrls: string[];
  gdevelopVersion: string;
}
