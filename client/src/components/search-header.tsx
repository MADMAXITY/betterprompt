import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { type Category } from "@shared/schema";

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory?: string;
  onCategoryChange: (categoryId: string | undefined) => void;
  totalCount: number;
}

export default function SearchHeader({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  totalCount
}: SearchHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <div className="bg-card border-b border-border p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
            <Input 
              type="text" 
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border-border focus:ring-ring"
              data-testid="input-search"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedCategory || "all"} onValueChange={(value) => onCategoryChange(value === "all" ? undefined : value)}>
            <SelectTrigger className="w-[180px] bg-background border-border" data-testid="select-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-background border-border hover:bg-accent"
            data-testid="button-filter"
          >
            <i className="fas fa-filter mr-2"></i>Filter
          </Button>
          
          <Button 
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90 lg:hidden"
            data-testid="button-new-mobile"
          >
            <a href="/ai-builder">
              <i className="fas fa-plus mr-2"></i>New
            </a>
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Advanced Filters</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                onSearchChange("");
                onCategoryChange(undefined);
              }}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-clear-filters"
            >
              Clear All
            </Button>
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground">
            Showing {totalCount} prompt{totalCount !== 1 ? 's' : ''}
            {selectedCategory && (
              <span> in {categories.find(c => c.id === selectedCategory)?.name || 'selected category'}</span>
            )}
            {searchQuery && (
              <span> matching "{searchQuery}"</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
