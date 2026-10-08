function SearchBar({ filters, onChange }) {
  return (
    <div className="content-card search-toolbar">
      <div className="form-grid compact-grid">
        <div className="input-group">
          <label htmlFor="searchTerm">Role or skill</label>
          <input
            id="searchTerm"
            name="searchTerm"
            type="text"
            placeholder="Role or skill, e.g. React"
            value={filters.searchTerm}
            onChange={onChange}
          />
        </div>

        <div className="input-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            type="text"
            placeholder="Remote"
            value={filters.location}
            onChange={onChange}
          />
        </div>

        <div className="input-group">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" name="sort" value={filters.sort} onChange={onChange}>
            <option value="match">Best skill match</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default SearchBar
