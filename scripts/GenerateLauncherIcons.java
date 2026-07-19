import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Ellipse2D;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.imageio.ImageIO;

public final class GenerateLauncherIcons {
  private static final Color BRAND_GREEN = new Color(0x0F6B3A);
  private static final double LEGACY_FOREGROUND_SCALE = 1.18;

  private GenerateLauncherIcons() {}

  public static void main(String[] args) throws IOException {
    Path root = Path.of("").toAbsolutePath();
    Path assets = root.resolve("assets");
    Path resources = root.resolve("android/app/src/main/res");

    BufferedImage original = read(assets.resolve("adaptive-icon.png"));
    BufferedImage centeredForeground = centerTransparentContent(original);
    write(centeredForeground, assets.resolve("adaptive-icon.png"));

    BufferedImage master = composeLegacyIcon(centeredForeground, 1024, false);
    write(master, assets.resolve("icon-master.png"));
    write(master, assets.resolve("icon.png"));
    write(composeLegacyIcon(centeredForeground, 48, true), assets.resolve("favicon.png"));

    BufferedImage splash = new BufferedImage(1024, 1024, BufferedImage.TYPE_INT_ARGB);
    Graphics2D splashGraphics = graphics(splash);
    BufferedImage splashMark = composeLegacyIcon(centeredForeground, 560, true);
    splashGraphics.drawImage(splashMark, 232, 232, null);
    splashGraphics.dispose();
    write(splash, assets.resolve("splash-icon.png"));

    Map<String, Integer> legacySizes = new LinkedHashMap<>();
    legacySizes.put("mipmap-mdpi", 48);
    legacySizes.put("mipmap-hdpi", 72);
    legacySizes.put("mipmap-xhdpi", 96);
    legacySizes.put("mipmap-xxhdpi", 144);
    legacySizes.put("mipmap-xxxhdpi", 192);

    for (Map.Entry<String, Integer> entry : legacySizes.entrySet()) {
      Path directory = resources.resolve(entry.getKey());
      int legacySize = entry.getValue();
      int foregroundSize = Math.round(legacySize * 2.25f);
      write(composeLegacyIcon(centeredForeground, legacySize, false), directory.resolve("ic_launcher.png"));
      write(composeLegacyIcon(centeredForeground, legacySize, true), directory.resolve("ic_launcher_round.png"));
      write(resize(centeredForeground, foregroundSize), directory.resolve("ic_launcher_foreground.png"));
    }
  }

  private static BufferedImage centerTransparentContent(BufferedImage source) {
    Bounds bounds = alphaBounds(source);
    double centerX = (bounds.minX + bounds.maxX) / 2.0;
    double centerY = (bounds.minY + bounds.maxY) / 2.0;
    int offsetX = (int) Math.round(source.getWidth() / 2.0 - centerX);
    int offsetY = (int) Math.round(source.getHeight() / 2.0 - centerY);

    BufferedImage centered = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_ARGB);
    Graphics2D graphics = graphics(centered);
    graphics.drawImage(source, offsetX, offsetY, null);
    graphics.dispose();
    return centered;
  }

  private static BufferedImage composeLegacyIcon(BufferedImage foreground, int size, boolean round) {
    BufferedImage icon = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
    Graphics2D graphics = graphics(icon);
    if (round) {
      graphics.setColor(BRAND_GREEN);
      graphics.fill(new Ellipse2D.Double(0, 0, size, size));
      graphics.setClip(new Ellipse2D.Double(0, 0, size, size));
    } else {
      graphics.setColor(BRAND_GREEN);
      graphics.fillRect(0, 0, size, size);
    }

    int foregroundSize = (int) Math.round(size * LEGACY_FOREGROUND_SCALE);
    int offset = (size - foregroundSize) / 2;
    graphics.drawImage(foreground, offset, offset, foregroundSize, foregroundSize, null);
    graphics.dispose();
    return icon;
  }

  private static BufferedImage resize(BufferedImage source, int size) {
    BufferedImage resized = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
    Graphics2D graphics = graphics(resized);
    graphics.drawImage(source, 0, 0, size, size, null);
    graphics.dispose();
    return resized;
  }

  private static Graphics2D graphics(BufferedImage image) {
    Graphics2D graphics = image.createGraphics();
    graphics.setComposite(AlphaComposite.SrcOver);
    graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
    graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
    graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
    return graphics;
  }

  private static Bounds alphaBounds(BufferedImage image) {
    int minX = image.getWidth();
    int minY = image.getHeight();
    int maxX = -1;
    int maxY = -1;

    for (int y = 0; y < image.getHeight(); y++) {
      for (int x = 0; x < image.getWidth(); x++) {
        int alpha = (image.getRGB(x, y) >>> 24) & 0xff;
        if (alpha <= 8) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < 0 || maxY < 0) throw new IllegalArgumentException("The foreground image is empty.");
    return new Bounds(minX, minY, maxX, maxY);
  }

  private static BufferedImage read(Path path) throws IOException {
    BufferedImage image = ImageIO.read(path.toFile());
    if (image == null) throw new IOException("Unable to read image: " + path);
    return image;
  }

  private static void write(BufferedImage image, Path path) throws IOException {
    Files.createDirectories(path.getParent());
    ImageIO.write(image, "png", path.toFile());
  }

  private record Bounds(int minX, int minY, int maxX, int maxY) {}
}
