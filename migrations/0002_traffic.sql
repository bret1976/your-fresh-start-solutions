create table if not exists page_counts (
  day date not null,
  path text not null,
  hits integer not null default 0,
  primary key (day, path)
);
